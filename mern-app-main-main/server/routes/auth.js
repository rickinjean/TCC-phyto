const express = require("express")
const authRoutes = express.Router()
const axios = require("axios")
const dbo = require("../db/conn")
const { signToken } = require("../middleware/auth")

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

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
        const newUser = {
            name,
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
    const redirectUri = `${FRONTEND_URL}/auth/google/callback`
    console.log("[OAuth Google] Iniciando login. redirect_uri:", redirectUri)
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
    console.log("[OAuth Google] Callback recebido. FRONTEND_URL:", FRONTEND_URL, "code:", code ? "presente" : "ausente")

    if (!code) {
        console.log("[OAuth Google] Sem code, redirecionando para erro")
        return res.redirect(`${FRONTEND_URL}/login?error=no_code`)
    }

    try {
        console.log("[OAuth Google] Trocando code por token...")
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${FRONTEND_URL}/auth/google/callback`,
            grant_type: "authorization_code",
        })

        const { access_token } = tokenRes.data
        console.log("[OAuth Google] Token obtido, buscando userinfo...")

        const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        })

        const { id, email, name, picture } = userRes.data
        console.log("[OAuth Google] Usuário:", email)

        const user = await findOrCreateUser(
            { id, email, name, avatar: picture },
            "google"
        )

        const token = signToken({ userId: user._id, tipo: user.function, name: user.name, avatar: user.avatar || null })
        console.log("[OAuth Google] Redirecionando para:", `${FRONTEND_URL}/?token=...`)

        res.redirect(`${FRONTEND_URL}/?token=${token}`)
    } catch (error) {
        console.error("[OAuth Google] ERRO:", error.response?.data || error.message)
        console.error("[OAuth Google] Stack:", error.stack)
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
