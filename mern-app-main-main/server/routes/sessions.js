const express = require("express")
const sessionsRoutes = express.Router()
const crypto = require("crypto")
const dbo = require("../db/conn")
const { signToken, signRefreshToken, verifyRefreshToken, REFRESH_TOKEN_TTL } = require("../middleware/auth")

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

function expiresInMs() {
    // Lê o TTL no mesmo padrão do middleware (env ou padrão "7d"), para que a
    // sessão no banco expira junto com o token JWT de refresh.
    const raw = process.env.REFRESH_TOKEN_TTL || REFRESH_TOKEN_TTL
    const value = parseInt(raw, 10)
    if (Number.isNaN(value)) return 7 * 24 * 60 * 60 * 1000
    const unit = raw.slice(String(value).length).trim().toLowerCase()
    const multiplier = unit === "d" || unit === "days" ? 24 * 60 * 60 * 1000
        : unit === "h" || unit === "hours" ? 60 * 60 * 1000
        : unit === "m" || unit === "minutes" ? 60 * 1000
        : 1000
    return value * multiplier
}

function userQuote(user) {
    return { userId: user._id, tipo: user.function || "User", name: user.name || user.user, avatar: user.avatar || null }
}

async function createSession(db_connect, user, rotatedFrom = null) {
    const refreshToken = signRefreshToken(userQuote(user))
    const session = {
        tokenHash: hashToken(refreshToken),
        userId: user._id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiresInMs()),
        rotatedFrom: rotatedFrom ? rotatedFrom : null,
    }
    await db_connect.collection("sessions").insertOne(session)
    return refreshToken
}

// Renova o par access/refresh. O refresh token é rotacionado: a sessão anterior
// é removida e uma nova é criada, de modo que um token usado novamente perde a validade.
sessionsRoutes.route("/auth/refresh").post(async function (req, res) {
    const db_connect = dbo.getDb()
    const authHeader = req.headers["authorization"]
    const refreshToken = authHeader && authHeader.split(" ")[1]

    if (!refreshToken) {
        return res.status(401).json({ mensagem: "Refresh token não enviado" })
    }

    try {
        const decoded = await verifyRefreshToken(refreshToken)

        const session = await db_connect.collection("sessions").findOne({
            tokenHash: hashToken(refreshToken),
            expiresAt: { $gt: new Date() },
        })

        if (!session) {
            return res.status(401).json({ mensagem: "Sessão inválida" })
        }

        const usuario = await db_connect.collection("users").findOne({ _id: session.userId })
        if (!usuario) {
            await db_connect.collection("sessions").deleteOne({ _id: session._id })
            return res.status(401).json({ mensagem: "Sessão inválida" })
        }

        await db_connect.collection("sessions").deleteOne({ _id: session._id })

        const newRefreshToken = await createSession(db_connect, usuario, session._id)

        const token = signToken(userQuote(usuario))

        res.json({ mensagem: "Sessão renovada", token, refreshToken: newRefreshToken })
    } catch (error) {
        return res.status(401).json({ mensagem: "Sessão inválida" })
    }
})

// Encerra a sessão no servidor (revoga o refresh token). O cliente também
// apaga os tokens locais, mas esta revogação impede reuso futuro do token.
sessionsRoutes.route("/auth/logout").post(async function (req, res) {
    const db_connect = dbo.getDb()
    const authHeader = req.headers["authorization"]
    const refreshToken = authHeader && authHeader.split(" ")[1]

    if (refreshToken) {
        await db_connect.collection("sessions").deleteOne({ tokenHash: hashToken(refreshToken) })
    }

    res.json({ mensagem: "Logout realizado" })
})

module.exports = sessionsRoutes
module.exports.createSession = createSession