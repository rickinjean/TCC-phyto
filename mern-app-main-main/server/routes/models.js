const express = require("express")
const router = express.Router()
const multer = require("multer")
const mongodb = require("mongodb")
const rateLimit = require("express-rate-limit")
const dbo = require("../db/conn")
const { getModelBucket } = require("../gridfs")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { asyncHandler } = require("../utils")
const logger = require("../logger")

const ObjectId = mongodb.ObjectId

const modelLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Muitas requisições. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.originalname.endsWith(".bin")) return cb(null, true)
        if (["model.json", "metadata.json", "dataset.json"].includes(file.originalname)) return cb(null, true)
        cb(new Error("Tipo de arquivo não permitido. Envie apenas arquivos .json e .bin do modelo."))
    },
})

const TM_FILE_RE = /^(model\.json|metadata\.json|group1-shard\d+of\d+\.bin)$/i

async function salvarArquivo(bucket, id, filename, buffer, mimetype) {
    return new Promise(function (resolve, reject) {
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: mimetype || "application/octet-stream",
            metadata: { modelId: id },
        })
        const readable = require("stream").Readable.from(buffer)
        readable.pipe(uploadStream)
        uploadStream.on("finish", resolve)
        uploadStream.on("error", reject)
    })
}

async function excluirArquivos(bucket, id) {
    const files = await bucket.find({ "metadata.modelId": id }).toArray()
    for (const file of files) {
        await bucket.delete(file._id)
    }
}

function parsearJSON(buffer, nomeArquivo) {
    try {
        return JSON.parse(buffer.toString("utf8"))
    } catch (e) {
        throw new Error(nomeArquivo + " não é um JSON válido")
    }
}

/* ==================================================
   LISTAR MODELOS (público)
================================================== */
router.get("/models", asyncHandler(async function (req, res) {
    const db = dbo.getDb()
    const modelos = await db.collection("ai_models")
        .find({}, { projection: { arquivos: 0 } })
        .sort({ criadoEm: -1 })
        .toArray()
    res.status(200).json(modelos)
}))

/* ==================================================
   UPLOAD MODELO KNN (ADM)
   Body: multipart com campo "dataset" (JSON) + nome, descricao
================================================== */
router.post("/models/knn", authenticateToken, authorizeRoles("ADM"), modelLimiter,
    upload.single("dataset"),
    asyncHandler(async function (req, res) {
        if (!req.file) {
            return res.status(400).json({ message: "Envie o arquivo dataset.json" })
        }

        const dataset = parsearJSON(req.file.buffer, "dataset.json")
        if (!dataset || !dataset.dataset || !dataset.classes) {
            return res.status(400).json({ message: "dataset.json deve conter 'classes' e 'dataset'" })
        }

        const classes = dataset.classes
        const totalClasses = classes.length
        if (totalClasses === 0) {
            return res.status(400).json({ message: "O modelo não possui classes" })
        }

        const labels = classes.map(function (c) { return c.nome })
        const exemploContagem = {}
        for (const [label, embeddings] of Object.entries(dataset.dataset)) {
            exemploContagem[label] = Array.isArray(embeddings) ? embeddings.length : 0
        }

        const modelId = new ObjectId()
        const bucket = getModelBucket()

        await salvarArquivo(bucket, modelId, modelId + "/dataset.json", req.file.buffer, "application/json")

        const doc = {
            _id: modelId,
            nome: String(req.body.nome || "Modelo KNN " + labels.join(", ")).substring(0, 100),
            descricao: String(req.body.descricao || "").substring(0, 500),
            tipo: "knn",
            criadoPor: { userId: req.user.userId, nome: req.user.name || "" },
            criadoEm: new Date(),
            totalClasses: totalClasses,
            labels: labels,
            classes: classes,
            exemploContagem: exemploContagem,
        }

        await db.collection("ai_models").insertOne(doc)
        logger.info({ modelId: modelId.toString(), totalClasses }, "[models] Modelo KNN criado")
        res.status(201).json({ message: "Modelo KNN criado com sucesso", id: modelId })
    })
)

/* ==================================================
   UPLOAD MODELO TEACHABLE MACHINE (ADM)
   Body: multipart com campos "model", "weights", "metadata"
         + nome (opcional), descricao (opcional)
================================================== */
router.post("/models/tm", authenticateToken, authorizeRoles("ADM"), modelLimiter,
    upload.fields([
        { name: "model", maxCount: 1 },
        { name: "weights", maxCount: 5 },
        { name: "metadata", maxCount: 1 },
    ]),
    asyncHandler(async function (req, res) {
        if (!req.files || !req.files.model || !req.files.metadata) {
            return res.status(400).json({ message: "Envie os arquivos model.json, weights (.bin) e metadata.json" })
        }

        const modelFile = req.files.model[0]
        const metadataFile = req.files.metadata[0]
        const weightFiles = req.files.weights || []

        const modelJSON = parsearJSON(modelFile.buffer, "model.json")
        if (!modelJSON.modelTopology) {
            return res.status(400).json({ message: "model.json inválido: ausente modelTopology" })
        }
        if (!modelJSON.weightsManifest) {
            return res.status(400).json({ message: "model.json inválido: ausente weightsManifest" })
        }

        const metadataJSON = parsearJSON(metadataFile.buffer, "metadata.json")
        const labels = metadataJSON.labels || metadataJSON.classLabels || []
        const totalClasses = labels.length || metadataJSON.totalClasses || 0

        if (totalClasses === 0) {
            return res.status(400).json({ message: "metadata.json não contém labels válidos" })
        }

        const modelId = new ObjectId()
        const bucket = getModelBucket()

        await salvarArquivo(bucket, modelId, modelId + "/model.json", modelFile.buffer, "application/json")
        await salvarArquivo(bucket, modelId, modelId + "/metadata.json", metadataFile.buffer, "application/json")

        for (const wf of weightFiles) {
            const safeName = wf.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")
            if (!TM_FILE_RE.test(safeName)) continue
            await salvarArquivo(bucket, modelId, modelId + "/" + safeName, wf.buffer, wf.mimetype)
        }

        const nome = String(req.body.nome || metadataJSON.projectName || "Modelo TM").substring(0, 100)
        const doc = {
            _id: modelId,
            nome: nome,
            descricao: String(req.body.descricao || "").substring(0, 500),
            tipo: "tm",
            criadoPor: { userId: req.user.userId, nome: req.user.name || "" },
            criadoEm: new Date(),
            totalClasses: totalClasses,
            labels: labels,
            arquivos: ["model.json", "metadata.json"].concat(weightFiles.map(function (f) { return f.originalname })),
        }

        await db.collection("ai_models").insertOne(doc)
        logger.info({ modelId: modelId.toString(), nome, totalClasses }, "[models] Modelo TM importado")
        res.status(201).json({ message: "Modelo TM importado com sucesso", id: modelId })
    })
)

/* ==================================================
   EXCLUIR MODELO (ADM)
================================================== */
router.delete("/models/:id", authenticateToken, authorizeRoles("ADM"), asyncHandler(async function (req, res) {
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }

    const id = new ObjectId(req.params.id)
    const db = dbo.getDb()
    const doc = await db.collection("ai_models").findOne({ _id: id })
    if (!doc) {
        return res.status(404).json({ message: "Modelo não encontrado" })
    }

    const bucket = getModelBucket()
    await excluirArquivos(bucket, id)
    await db.collection("ai_models").deleteOne({ _id: id })
    logger.info({ modelId: req.params.id }, "[models] Modelo excluído")
    res.status(200).json({ message: "Modelo excluído com sucesso" })
}))

/* ==================================================
   SERVIR DATASET KNN (público)
================================================== */
router.get("/models/:id/dataset", asyncHandler(async function (req, res) {
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }

    const bucket = getModelBucket()
    const filename = req.params.id + "/dataset.json"

    try {
        res.setHeader("Cache-Control", "public, max-age=3600")
        res.setHeader("Content-Type", "application/json")
        bucket.openDownloadStreamByName(filename).pipe(res)
    } catch (e) {
        return res.status(404).json({ message: "Dataset não encontrado" })
    }
}))

/* ==================================================
   SERVIR ARQUIVOS TM (público)
   GET /models/:id/files/model.json
   GET /models/:id/files/group1-shard1of1.bin
   GET /models/:id/files/metadata.json
================================================== */
router.get("/models/:id/files/*", asyncHandler(async function (req, res) {
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }

    const file = req.params[0]
    if (!TM_FILE_RE.test(file)) {
        return res.status(400).json({ message: "Nome de arquivo inválido" })
    }

    const bucket = getModelBucket()
    const filename = req.params.id + "/" + file

    try {
        res.setHeader("Cache-Control", "public, max-age=3600")
        if (file.endsWith(".json")) {
            res.setHeader("Content-Type", "application/json")
        } else {
            res.setHeader("Content-Type", "application/octet-stream")
        }
        const stream = bucket.openDownloadStreamByName(filename)
        stream.on("error", function () {
            if (!res.headersSent) res.status(404).json({ message: "Arquivo não encontrado" })
        })
        stream.pipe(res)
    } catch (e) {
        if (!res.headersSent) res.status(404).json({ message: "Arquivo não encontrado" })
    }
}))

module.exports = router
