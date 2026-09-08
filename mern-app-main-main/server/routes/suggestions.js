const express = require("express")
const suggestionsRoutes = express.Router()
const rateLimit = require("express-rate-limit")
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

const suggestionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Muitas sugestões enviadas. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
})

const STATUS_VALIDOS = ["pendente", "aprovada", "rejeitada", "concluida"]

// Campos de "nova planta" que viram a ficha no catálogo ao publicar.
const CAMPOS_NOVA = [
    "name", "scientificName", "simpleDescription", "description",
    "origin", "type", "Family", "Genero", "Especie"
]

/* ==================================================
   ENVIAR SUGESTÃO (usuário logado)
   tipo: "nova" | "correcao"
================================================== */
suggestionsRoutes.route("/suggestions").post(authenticateToken, suggestionLimiter, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const { tipo, data, plantaId, plantaNome, campo, texto } = req.body

        if (tipo === "nova") {
            const name = String(data?.name || "").trim()
            if (!name) {
                return res.status(400).json({ message: "Informe o nome da planta." })
            }
        } else if (tipo === "correcao") {
            if (!ObjectId.isValid(plantaId)) {
                return res.status(400).json({ message: "Selecione a planta com erro." })
            }
            if (!texto || !String(texto).trim()) {
                return res.status(400).json({ message: "Descreva o erro encontrado." })
            }
        } else {
            return res.status(400).json({ message: "Tipo de sugestão inválido." })
        }

        const doc = {
            userId: new ObjectId(req.user.userId),
            userName: req.user.name || "",
            tipo,
            status: "pendente",
            data: tipo === "nova" ? data : null,
            plantaId: tipo === "correcao" ? new ObjectId(plantaId) : null,
            plantaNome: tipo === "correcao" ? String(plantaNome || "") : null,
            campo: tipo === "correcao" ? String(campo || "") : null,
            texto: tipo === "correcao" ? String(texto || "").trim() : null,
            anotacao: "",
            plantaCriadaId: null,
            created: new Date(),
            resolved: null
        }

        const result = await db_connect.collection("suggestions").insertOne(doc)
        res.status(201).json({ message: "Sugestão enviada com sucesso!", id: result.insertedId })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   LISTAR SUGESTÕES (ADM) — opcional por ?status=
================================================== */
suggestionsRoutes.route("/suggestions").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const filter = {}
        if (req.query.status && STATUS_VALIDOS.includes(req.query.status)) {
            filter.status = req.query.status
        }
        const result = await db_connect.collection("suggestions")
            .find(filter)
            .sort({ created: -1 })
            .limit(200)
            .toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   APROVAR / REJEITAR / CONCLUIR SUGESTÃO (ADM)
   body: { status, anotacao? }
================================================== */
suggestionsRoutes.route("/suggestions/:id").patch(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const status = req.body.status
        if (!STATUS_VALIDOS.includes(status)) {
            return res.status(400).json({ message: "Status inválido" })
        }

        const update = {
            $set: {
                status,
                anotacao: String(req.body.anotacao || "").trim().slice(0, 500)
            }
        }
        if (status === "rejeitada" || status === "concluida") {
            update.$set.resolved = new Date()
        } else {
            update.$set.resolved = null
        }

        const result = await db_connect.collection("suggestions").updateOne(
            { _id: new ObjectId(req.params.id) },
            update
        )
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Sugestão não encontrada" })
        }
        res.status(200).json({ message: "Sugestão atualizada" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   PUBLICAR PLANTA NO CATÁLOGO (ADM)
   Converte uma sugestão "nova" aprovada em uma ficha de planta.
================================================== */
suggestionsRoutes.route("/suggestions/:id/publicar").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const sId = new ObjectId(req.params.id)

        const s = await db_connect.collection("suggestions").findOne({ _id: sId })
        if (!s) {
            return res.status(404).json({ message: "Sugestão não encontrada" })
        }
        if (s.tipo !== "nova") {
            return res.status(400).json({ message: "Apenas sugestões de nova planta podem ser publicadas." })
        }
        if (s.status !== "aprovada") {
            return res.status(409).json({ message: "A sugestão precisa estar aprovada." })
        }
        if (s.plantaCriadaId) {
            return res.status(409).json({ message: "A planta já foi publicada a partir desta sugestão." })
        }

        const data = s.data || {}
        const myobj = {}
        for (const campo of CAMPOS_NOVA) {
            const v = data[campo]
            myobj[campo] = v === undefined ? "" : v
        }
        myobj.imagesPath = []
        myobj.imagePath = ""
        myobj.imagesMeta = []

        const result = await db_connect.collection("plants").insertOne(myobj)

        await db_connect.collection("suggestions").updateOne(
            { _id: sId, status: "aprovada" },
            { $set: { status: "concluida", plantaCriadaId: result.insertedId, resolved: new Date() } }
        )

        res.status(201).json({ message: "Planta publicada no catálogo", plantId: result.insertedId })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = suggestionsRoutes