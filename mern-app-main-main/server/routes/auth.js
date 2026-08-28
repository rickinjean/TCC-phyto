const express = require("express")
const authRoutes = express.Router()
const axios = require("axios")
const dbo = require("../db/conn")
const { signToken } = require("../middleware/auth")

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

async function generateUsername(name, db) {
    const base = (name || "usuario")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 15) || "usuario"
    const suffix = Math.floor(1000 + Math.random() * 9000)
    let candidate = `${base}_${suffix}`
    let exists = await db.collection("users").findOne({ user: candidate })
    let attempts = 0
    while (exists && attempts < 10) {
        candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`
        exists = await db.collection("users").findOne({ user: candidate })
        attempts++
    }
    return candidate
}

async function findOrCreateUser(profile, provider) {
    const db_connect = dbo.getDb()
    if (!db_connect) throw new Error("Database not connected")
    const { id, email, name, avatar } = profile

    let user = await db_connect.collection("users").findOne({ email })

    if (user) {
        if (!user.provider || user.provider === "local") {
            await db_connect.collection("users").updateOne(
                { _id: user._id },
                { $set: { provider, providerId: id, avatar: avatar || user.avatar } }
            )
            user.provider = provider
            user.providerId = id
            if (avatar) user.avatar = avatar
        }
    } else {
        const username = await generateUsername(name, db_connect)
        const newUser = {
            name,
            user: username,
            email,
            senha: null,
            function: "User",
            provider,
            providerId: id,
            avatar: avatar || null,
        }
        const result = await db_connect.collection("users").insertOne(newUser)
        user = { ...newUser, _id: result.insertedId }
    }

    return user
}

// ========== GOOGLE ==========

authRoutes.get("/auth/google", (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${FRONTEND_URL}/auth/google/callback`,
        response_type: "code",
        scope: "openid profile email",
        access_type: "offline",
        prompt: "consent",
    })
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

authRoutes.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_code`)
    }

    try {
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${FRONTEND_URL}/auth/google/callback`,
            grant_type: "authorization_code",
        })

        const { access_token } = tokenRes.data

        const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        })

        const { id, email, name, picture } = userRes.data

        const user = await findOrCreateUser(
            { id, email, name, avatar: picture },
            "google"
        )

        const token = signToken({ userId: user._id, tipo: user.function, name: user.name, avatar: user.avatar || null })

        res.redirect(`${FRONTEND_URL}/?token=${token}`)
    } catch (error) {
        console.error("[OAuth Google] Erro:", error.response?.data || error.message)
        res.redirect(`${FRONTEND_URL}/login?error=google_failed`)
    }
})

// ========== GITHUB ==========

authRoutes.get("/auth/github", (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: `${FRONTEND_URL}/auth/github/callback`,
        scope: "user:email",
    })
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
})

authRoutes.get("/auth/github/callback", async (req, res) => {
    const { code } = req.query

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_code`)
    }

    try {
        const tokenRes = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: `${FRONTEND_URL}/auth/github/callback`,
            },
            { headers: { Accept: "application/json" } }
        )

        const { access_token } = tokenRes.data

        const userRes = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${access_token}` },
        })

        const emailsRes = await axios.get("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${access_token}` },
        })

        const primaryEmail = emailsRes.data.find(e => e.primary)?.email || emailsRes.data[0]?.email

        const { id, name, avatar_url } = userRes.data

        const displayName = name || userRes.data.login

        const user = await findOrCreateUser(
            { id: String(id), email: primaryEmail, name: displayName, avatar: avatar_url },
            "github"
        )

        const token = signToken({ userId: user._id, tipo: user.function, name: user.name, avatar: user.avatar || null })

        res.redirect(`${FRONTEND_URL}/?token=${token}`)
    } catch (error) {
        console.error("Erro no OAuth GitHub:", error.response?.data || error.message)
        res.redirect(`${FRONTEND_URL}/login?error=github_failed`)
    }
})

module.exports = authRoutes
module.exports.generateUsername = generateUsername
