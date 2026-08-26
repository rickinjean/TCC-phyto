const express = require("express")
const favoritesRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken } = require("../middleware/auth")

/* ==================================================
   LISTAR FAVORITOS DO USUÁRIO (com dados da planta populados)
================================================== */
favoritesRoutes.route("/favorites").get(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const userId = new ObjectId(req.user.userId)
        const result = await db_connect.collection("favorites").aggregate([
            { $match: { userId } },
            { $lookup: { from: "plants", localField: "plantId", foreignField: "_id", as: "plant" } },
            { $unwind: "$plant" },
            { $sort: { createdAt: -1 } },
            { $project: { _id: 1, plantId: 1, createdAt: 1, plant: 1 } }
        ]).toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   ADICIONAR FAVORITO
================================================== */
favoritesRoutes.route("/favorites").post(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const userId = new ObjectId(req.user.userId)
        const plantId = new ObjectId(req.body.plantId)

        const existing = await db_connect.collection("favorites").findOne({ userId, plantId })
        if (existing) {
            return res.status(409).json({ message: "Planta já está nos favoritos" })
        }

        const myobj = { userId, plantId, createdAt: new Date() }
        const result = await db_connect.collection("favorites").insertOne(myobj)
        res.status(201).json({ _id: result.insertedId, plantId: req.body.plantId })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   REMOVER FAVORITO
================================================== */
favoritesRoutes.route("/favorites/:plantId").delete(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const userId = new ObjectId(req.user.userId)
        const plantId = new ObjectId(req.params.plantId)

        const result = await db_connect.collection("favorites").deleteOne({ userId, plantId })
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Favorito não encontrado" })
        }
        res.status(200).json({ message: "Favorito removido com sucesso" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = favoritesRoutes
