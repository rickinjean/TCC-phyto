const express = require("express")
const userListsRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken } = require("../middleware/auth")

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const NOME_LIMITE = 80

function nomeValido(nome) {
    const n = String(nome || "").trim()
    return n && n.length <= NOME_LIMITE ? n : null
}

/* ==================================================
   LISTA DE LISTAS DO USUÁRIO (com contagem de plantas)
   Uso: GET /userlists?plantId=<id> também informa em quais
   listas a planta está (propriedade `contains`).
================================================== */
userListsRoutes.route("/userlists").get(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const userId = new ObjectId(req.user.userId)

        const lists = await db_connect.collection("userlists").aggregate([
            { $match: { userId } },
            { $lookup: { from: "userlist_items", localField: "_id", foreignField: "listId", as: "items" } },
            { $project: { _id: 1, name: 1, createdAt: 1, count: { $size: "$items" } } },
            { $sort: { createdAt: -1 } }
        ]).toArray()

        let membership = null
        if (req.query.plantId && ObjectId.isValid(req.query.plantId)) {
            const plantId = new ObjectId(req.query.plantId)
            const items = await db_connect.collection("userlist_items").aggregate([
                { $match: { plantId } },
                { $lookup: { from: "userlists", localField: "listId", foreignField: "_id", as: "lst" } },
                { $match: { "lst.userId": userId } },
                { $project: { _id: 0, listId: 1 } }
            ]).toArray()
            membership = new Set(items.map(i => String(i.listId)))
        }

        const result = lists.map(l => ({
            _id: l._id,
            name: l.name,
            createdAt: l.createdAt,
            count: l.count,
            contains: membership ? membership.has(String(l._id)) : null
        }))
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   CRIAR LISTA
================================================== */
userListsRoutes.route("/userlists").post(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const name = nomeValido(req.body.name)
        if (!name) {
            return res.status(400).json({ message: `Informe um nome de até ${NOME_LIMITE} caracteres.` })
        }
        const userId = new ObjectId(req.user.userId)

        const duplicada = await db_connect.collection("userlists").findOne({
            userId,
            name: new RegExp(`^${escapeRegex(name)}$`, "i")
        })
        if (duplicada) {
            return res.status(409).json({ message: "Você já tem uma lista com esse nome." })
        }

        const myobj = { userId, name, createdAt: new Date() }
        const result = await db_connect.collection("userlists").insertOne(myobj)
        res.status(201).json({ _id: result.insertedId, name })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   RENOMEAR LISTA
================================================== */
userListsRoutes.route("/userlists/:id").put(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const name = nomeValido(req.body.name)
        if (!name) {
            return res.status(400).json({ message: `Informe um nome de até ${NOME_LIMITE} caracteres.` })
        }
        const userId = new ObjectId(req.user.userId)
        const listId = new ObjectId(req.params.id)

        const duplicada = await db_connect.collection("userlists").findOne({
            userId,
            _id: { $ne: listId },
            name: new RegExp(`^${escapeRegex(name)}$`, "i")
        })
        if (duplicada) {
            return res.status(409).json({ message: "Você já tem uma lista com esse nome." })
        }

        const result = await db_connect.collection("userlists").updateOne(
            { _id: listId, userId },
            { $set: { name } }
        )
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Lista não encontrada" })
        }
        res.status(200).json({ message: "Lista renomeada com sucesso", name })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   EXCLUIR LISTA (remove também os itens dela)
================================================== */
userListsRoutes.route("/userlists/:id").delete(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const userId = new ObjectId(req.user.userId)
        const listId = new ObjectId(req.params.id)

        const result = await db_connect.collection("userlists").deleteOne({ _id: listId, userId })
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Lista não encontrada" })
        }
        await db_connect.collection("userlist_items").deleteMany({ listId }).catch(() => {})
        res.status(200).json({ message: "Lista excluída com sucesso" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   PLANTAS DE UMA LISTA (com dados da planta populados)
================================================== */
userListsRoutes.route("/userlists/:id/plants").get(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const userId = new ObjectId(req.user.userId)
        const listId = new ObjectId(req.params.id)

        const lista = await db_connect.collection("userlists").findOne(
            { _id: listId, userId },
            { projection: { _id: 1, name: 1, createdAt: 1 } }
        )
        if (!lista) {
            return res.status(404).json({ message: "Lista não encontrada" })
        }

        const plants = await db_connect.collection("userlist_items").aggregate([
            { $match: { listId } },
            { $lookup: { from: "plants", localField: "plantId", foreignField: "_id", as: "plant" } },
            { $unwind: "$plant" },
            { $sort: { createdAt: -1 } },
            { $project: { _id: 1, plantId: 1, createdAt: 1, plant: 1 } }
        ]).toArray()

        res.status(200).json({ lista, plants })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   ADICIONAR PLANTA NUMA LISTA
================================================== */
userListsRoutes.route("/userlists/:id/plants").post(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.body.plantId)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const userId = new ObjectId(req.user.userId)
        const listId = new ObjectId(req.params.id)
        const plantId = new ObjectId(req.body.plantId)

        const lista = await db_connect.collection("userlists").findOne({ _id: listId, userId })
        if (!lista) {
            return res.status(404).json({ message: "Lista não encontrada" })
        }
        const jaExiste = await db_connect.collection("userlist_items").findOne({ listId, plantId })
        if (jaExiste) {
            return res.status(409).json({ message: "A planta já está nesta lista" })
        }

        const myobj = { listId, plantId, createdAt: new Date() }
        const result = await db_connect.collection("userlist_items").insertOne(myobj)
        res.status(201).json({ _id: result.insertedId, listId, plantId })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   REMOVER PLANTA DE UMA LISTA
================================================== */
userListsRoutes.route("/userlists/:id/plants/:plantId").delete(authenticateToken, async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.params.plantId)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const userId = new ObjectId(req.user.userId)
        const listId = new ObjectId(req.params.id)
        const plantId = new ObjectId(req.params.plantId)

        const lista = await db_connect.collection("userlists").findOne({ _id: listId, userId })
        if (!lista) {
            return res.status(404).json({ message: "Lista não encontrada" })
        }

        const result = await db_connect.collection("userlist_items").deleteOne({ listId, plantId })
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "A planta não está nesta lista" })
        }
        res.status(200).json({ message: "Planta removida da lista" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = userListsRoutes