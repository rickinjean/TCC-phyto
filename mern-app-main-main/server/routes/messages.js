const express = require("express")
const messagesRoutes = express.Router()
const rateLimit = require("express-rate-limit")
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { validationResult } = require("express-validator")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { asyncHandler } = require("../utils")
const { messageValidation } = require("../middleware/validate")

const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Muitas mensagens enviadas. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
})

function checkValidation(req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }
    next()
}

messagesRoutes.route("/messages").post(messageLimiter, messageValidation, checkValidation, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const { nome, email, assunto, mensagem } = req.body

    if (!nome || !email || !assunto || !mensagem) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios." })
    }

    const doc = {
        nome,
        email,
        assunto,
        mensagem,
        createdAt: new Date()
    }

    const result = await db_connect.collection("messages").insertOne(doc)
    res.status(201).json({ message: "Mensagem enviada com sucesso!", id: result.insertedId })
}))

messagesRoutes.route("/messages").get(authenticateToken, authorizeRoles("ADM"), asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const result = await db_connect.collection("messages").find({}).sort({ createdAt: -1 }).toArray()
    res.status(200).json(result)
}))

messagesRoutes.route("/messages/:id").delete(authenticateToken, authorizeRoles("ADM"), asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }
    const result = await db_connect.collection("messages").deleteOne({ _id: new ObjectId(req.params.id) })
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Mensagem não encontrada" })
    }
    res.status(200).json({ message: "Mensagem removida" })
}))

module.exports = messagesRoutes