const express = require("express")
const userListsRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken } = require("../middleware/auth")
const { escapeRegex, asyncHandler } = require("../utils")

const NOME_LIMITE = 80

const COR_PADRAO = "#2f8a5d"
const CORES_PALETA = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
    "#2f8a5d", "#3498db", "#9b59b6", "#e91e63",
]

function nomeValido(nome) {
    const n = String(nome || "").trim()
    return n && n.length <= NOME_LIMITE ? n : null
}

function corValida(cor) {
    const c = String(cor || "").trim()
    return /^#[0-9a-fA-F]{6}$/.test(c) ? c.toLowerCase() : null
}

/* Migração preguiçosa: usuários que tinham favoritos no modelo antigo ganham
   automaticamente uma coleção "Favoritos" com as plantas que já haviam marcado. */
async function migrarFavoritosParaLista(db, userId) {
    const temFavoritos = await db.collection("favorites").countDocuments({ userId }).catch(() => 0)
    if (!temFavoritos) return
    const temLista = await db.collection("userlists").findOne({ userId })
    if (temLista) return
    const antigos = await db.collection("favorites").find({ userId }).toArray().catch(() => [])
    if (antigos.length === 0) return

    const result = await db.collection("userlists").insertOne({
        userId,
        name: "Favoritos",
        color: COR_PADRAO,
        createdAt: new Date(),
    })
    const listId = result.insertedId
    const itens = antigos
        .filter(f => f.plantId)
        .map(f => ({ listId, plantId: f.plantId, createdAt: f.createdAt || new Date() }))
    if (itens.length) {
        await db.collection("userlist_items").insertMany(itens)
    }
    await db.collection("favorites").deleteMany({ userId }).catch(() => {})
}

function corDe(lista) {
    return lista && lista.color && corValida(lista.color) ? lista.color : COR_PADRAO
}

/* ==================================================
   LISTA DE LISTAS DO USUÁRIO (com contagem de plantas)
   Uso: GET /userlists?plantId=<id> também informa em quais
   listas a planta está (propriedade `contains`).
================================================== */
userListsRoutes.route("/userlists").get(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const userId = new ObjectId(req.user.userId)
    await migrarFavoritosParaLista(db_connect, userId)

    const lists = await db_connect.collection("userlists").aggregate([
        { $match: { userId } },
        { $lookup: { from: "userlist_items", localField: "_id", foreignField: "listId", as: "items" } },
        { $project: { _id: 1, name: 1, color: 1, createdAt: 1, count: { $size: "$items" } } },
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
        color: corDe(l),
        createdAt: l.createdAt,
        count: l.count,
        contains: membership ? membership.has(String(l._id)) : null
    }))
    res.status(200).json(result)
}))

/* ==================================================
   MEMBERSHIP: lista quais plantas estão em quais coleções
   do usuário. Uso: GET /userlists/membership
   Retorno: { lists, membership } onde membership[plantId] =
   array de ids de listas (mais recente primeiro).
================================================== */
userListsRoutes.route("/userlists/membership").get(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    const userId = new ObjectId(req.user.userId)
    await migrarFavoritosParaLista(db_connect, userId)

    const lists = await db_connect.collection("userlists").find(
        { userId },
        { projection: { _id: 1, name: 1, color: 1 } }
    ).toArray()
    if (lists.length === 0) {
        return res.status(200).json({ lists: [], membership: {} })
    }

    const listIds = lists.map(l => l._id)
    const itens = await db_connect.collection("userlist_items").aggregate([
        { $match: { listId: { $in: listIds } } },
        { $sort: { createdAt: -1 } },
        { $project: { _id: 0, listId: 1, plantId: 1 } }
    ]).toArray()

    const membership = {}
    for (const it of itens) {
        const key = String(it.plantId)
        if (!membership[key]) membership[key] = []
        const listId = String(it.listId)
        if (membership[key].indexOf(listId) === -1) membership[key].push(listId)
    }

    res.status(200).json({
        lists: lists.map(l => ({ _id: l._id, name: l.name, color: corDe(l) })),
        membership,
    })
}))

/* ==================================================
   CRIAR LISTA
================================================== */
userListsRoutes.route("/userlists").post(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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

    const myobj = { userId, name, color: corValida(req.body.color) || COR_PADRAO, createdAt: new Date() }
    const result = await db_connect.collection("userlists").insertOne(myobj)
    res.status(201).json({ _id: result.insertedId, name, color: myobj.color })
}))

/* ==================================================
   RENOMEAR LISTA
================================================== */
userListsRoutes.route("/userlists/:id").put(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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
        { $set: { name, color: corValida(req.body.color) || COR_PADRAO } }
    )
    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Lista não encontrada" })
    }
    res.status(200).json({ message: "Lista atualizada com sucesso", name })
}))

/* ==================================================
   EXCLUIR LISTA (remove também os itens dela)
================================================== */
userListsRoutes.route("/userlists/:id").delete(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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
}))

/* ==================================================
   PLANTAS DE UMA LISTA (com dados da planta populados)
================================================== */
userListsRoutes.route("/userlists/:id/plants").get(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }
    const userId = new ObjectId(req.user.userId)
    const listId = new ObjectId(req.params.id)

    const lista = await db_connect.collection("userlists").findOne(
        { _id: listId, userId },
        { projection: { _id: 1, name: 1, color: 1, createdAt: 1 } }
    )
    if (!lista) {
        return res.status(404).json({ message: "Lista não encontrada" })
    }
    lista.color = corDe(lista)

    const plants = await db_connect.collection("userlist_items").aggregate([
        { $match: { listId } },
        { $lookup: { from: "plants", localField: "plantId", foreignField: "_id", as: "plant" } },
        { $unwind: "$plant" },
        { $sort: { createdAt: -1 } },
        { $project: { _id: 1, plantId: 1, createdAt: 1, plant: 1 } }
    ]).toArray()

    res.status(200).json({ lista, plants })
}))

/* ==================================================
   ADICIONAR PLANTA NUMA LISTA
================================================== */
userListsRoutes.route("/userlists/:id/plants").post(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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
}))

/* ==================================================
   REMOVER PLANTA DE UMA LISTA
================================================== */
userListsRoutes.route("/userlists/:id/plants/:plantId").delete(authenticateToken, asyncHandler(async function (req, res) {
    const db_connect = dbo.getDb()
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
}))

module.exports = userListsRoutes