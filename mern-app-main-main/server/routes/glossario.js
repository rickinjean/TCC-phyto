const express = require("express")
const { ObjectId } = require("mongodb")
const dbo = require("../db/conn")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { asyncHandler } = require("../utils")

const router = express.Router()
const admin = [authenticateToken, authorizeRoles("ADM")]
const CACHE_MS = 5 * 60 * 1000
let publicCache = null
let cacheUntil = 0

function normalizeTerm(term) {
    return term.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR")
}

function invalidateCache() {
    publicCache = null
    cacheUntil = 0
}

router.get("/", asyncHandler(async (req, res) => {
    if (publicCache && Date.now() < cacheUntil) {
        res.set("Cache-Control", "public, max-age=0, s-maxage=300")
        return res.json(publicCache)
    }
    const docs = await dbo.getDb().collection("glossario")
        .find({}, { projection: { _id: 0, termo: 1, definicao: 1 } })
        .sort({ termoNormalizado: 1 }).toArray()
    publicCache = Object.fromEntries(docs.map(({ termo, definicao }) => [termo, definicao]))
    cacheUntil = Date.now() + CACHE_MS
    res.set("Cache-Control", "public, max-age=0, s-maxage=300").json(publicCache)
}))

router.get("/admin", ...admin, asyncHandler(async (req, res) => {
    const docs = await dbo.getDb().collection("glossario").find({}).sort({ termoNormalizado: 1 }).toArray()
    res.json(docs.map(({ _id, termo, definicao }) => ({ id: _id.toString(), termo, definicao })))
}))

router.post("/", ...admin, asyncHandler(async (req, res) => {
    const termo = typeof req.body.termo === "string" ? req.body.termo.trim() : ""
    const definicao = typeof req.body.definicao === "string" ? req.body.definicao.trim() : ""
    if (!termo || !definicao || termo.length > 100 || definicao.length > 500) {
        return res.status(400).json({ mensagem: "Informe termo (até 100 caracteres) e definição (até 500 caracteres)." })
    }
    try {
        const result = await dbo.getDb().collection("glossario").insertOne({ termo, definicao, termoNormalizado: normalizeTerm(termo), criadoEm: new Date() })
        invalidateCache()
        res.status(201).json({ id: result.insertedId.toString(), termo, definicao })
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ mensagem: "Este termo já existe no glossário." })
        throw error
    }
}))

router.put("/:id", ...admin, asyncHandler(async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ mensagem: "ID inválido." })
    const termo = typeof req.body.termo === "string" ? req.body.termo.trim() : ""
    const definicao = typeof req.body.definicao === "string" ? req.body.definicao.trim() : ""
    if (!termo || !definicao || termo.length > 100 || definicao.length > 500) {
        return res.status(400).json({ mensagem: "Informe termo (até 100 caracteres) e definição (até 500 caracteres)." })
    }
    try {
        const result = await dbo.getDb().collection("glossario").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { termo, definicao, termoNormalizado: normalizeTerm(termo), atualizadoEm: new Date() } }
        )
        if (!result.matchedCount) return res.status(404).json({ mensagem: "Termo não encontrado." })
        invalidateCache()
        res.json({ id: req.params.id, termo, definicao })
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ mensagem: "Este termo já existe no glossário." })
        throw error
    }
}))

router.delete("/:id", ...admin, asyncHandler(async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ mensagem: "ID inválido." })
    const result = await dbo.getDb().collection("glossario").deleteOne({ _id: new ObjectId(req.params.id) })
    if (!result.deletedCount) return res.status(404).json({ mensagem: "Termo não encontrado." })
    invalidateCache()
    res.status(204).end()
}))

module.exports = router
