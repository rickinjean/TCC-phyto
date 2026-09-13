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
        if (file.originalname === "dataset.json") return cb(null, true)
        cb(new Error("Tipo de arquivo não permitido. Envie apenas dataset.json."))
    },
})

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
        .find({ tipo: "knn" }, { projection: { arquivos: 0 } })
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

module.exports = router
