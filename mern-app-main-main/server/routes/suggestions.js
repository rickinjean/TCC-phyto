const express = require("express")
const suggestionsRoutes = express.Router()
const rateLimit = require("express-rate-limit")
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { asyncHandler } = require("../utils")

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
suggestionsRoutes.route("/suggestions").post(authenticateToken, suggestionLimiter, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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
        plantaCriadaId: null,
        created: new Date(),
        resolved: null
    }

    const result = await db_connect.collection("suggestions").insertOne(doc)
    res.status(201).json({ message: "Sugestão enviada com sucesso!", id: result.insertedId })
}))

/* ==================================================
   LISTAR SUGESTÕES (ADM) — opcional por ?status=
================================================== */
suggestionsRoutes.route("/suggestions").get(authenticateToken, authorizeRoles("ADM"), asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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
}))

/* ==================================================
   MINHAS SUGESTÕES (usuário logado)
   Lista apenas as sugestões enviadas pelo próprio usuário.
   Declarada ANTES de /suggestions/:id para não casar com o ":id".
================================================== */
suggestionsRoutes.route("/suggestions/minhas").get(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const result = await db_connect.collection("suggestions")
        .find({ userId: new ObjectId(req.user.userId) })
        .sort({ created: -1 })
        .limit(100)
        .toArray()
    res.status(200).json(result)
}))

/* ==================================================
   BUSCAR UMA SUGESTÃO (ADM) — usada para pré-preencher o createplant
================================================== */
suggestionsRoutes.route("/suggestions/:id").get(authenticateToken, authorizeRoles("ADM"), asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }
    const sug = await db_connect.collection("suggestions").findOne({ _id: new ObjectId(req.params.id) })
    if (!sug) {
        return res.status(404).json({ message: "Sugestão não encontrada" })
    }
    res.status(200).json(sug)
}))

/* ==================================================
   APROVAR / REJEITAR / CONCLUIR SUGESTÃO (ADM)
   body: { status }
================================================== */
suggestionsRoutes.route("/suggestions/:id").patch(authenticateToken, authorizeRoles("ADM"), asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }

    const status = req.body.status
    const temStatus = status !== undefined && status !== null && status !== ""
    if (temStatus && !STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ message: "Status inválido" })
    }

    const sug = await db_connect.collection("suggestions").findOne({ _id: new ObjectId(req.params.id) })
    if (!sug) {
        return res.status(404).json({ message: "Sugestão não encontrada" })
    }

    const update = {}

    if (temStatus) {
        update.$set = {
            status
        }
        if (status === "rejeitada" || status === "concluida") {
            update.$set.resolved = new Date()
        } else {
            update.$set.resolved = null
        }
    }

    if (req.body.data && typeof req.body.data === "object") {
        if (sug.tipo !== "nova") {
            return res.status(400).json({ message: "Sugestões de correção não aceitam edição de dados." })
        }
        const dadosAceitos = {}
        for (const campo of CAMPOS_NOVA) {
            if (req.body.data[campo] !== undefined) {
                dadosAceitos[campo] = req.body.data[campo]
            }
        }
        update.$set = update.$set || {}
        update.$set.data = { ...(sug.data || {}), ...dadosAceitos }
        // Ao editar os dados, resetamos o estado de publicação para exigir nova decisão do ADM.
        update.$set.plantaCriadaId = null
    }

    if (!update.$set) {
        return res.status(400).json({ message: "Nenhuma alteração informada." })
    }

    const result = await db_connect.collection("suggestions").updateOne(
        { _id: new ObjectId(req.params.id) },
        update
    )
    res.status(200).json({ message: "Sugestão atualizada" })
}))

/* ==================================================
   LIMPEZA AUTOMÁTICA DE SUGESTÕES ENCERRADAS
   Remove rejeitadas/concluídas com resolved mais antigo que o TTL.
   TTL configuravel via SUGGESTION_TTL_DAYS (padrão: 30 dias).
================================================== */
function limparSugestoesEncerradas() {
    const db_connect = dbo.getDb()
    const ttlDias = parseInt(process.env.SUGGESTION_TTL_DAYS, 10) || 30
    const corte = new Date(Date.now() - ttlDias * 24 * 60 * 60 * 1000)
    return db_connect.collection("suggestions").deleteMany({
        status: { $in: ["rejeitada", "concluida"] },
        resolved: { $lt: corte },
    })
}

module.exports = suggestionsRoutes
module.exports.limparSugestoesEncerradas = limparSugestoesEncerradas