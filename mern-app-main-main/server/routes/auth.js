const express = require("express")
const authRoutes = express.Router()
const axios = require("axios")
const dbo = require("../db/conn")
const { signToken } = require("../middleware/auth")
const { createSession } = require("./sessions")
const { createOpaqueValue, stateMatches, createOAuthCode, consumeOAuthCode } = require("../oauthSecurity")
const logger = require("../logger")

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"
const OAUTH_CALLBACK_BASE_URL = process.env.OAUTH_CALLBACK_BASE_URL
    || ((process.env.NODE_ENV === "production" || process.env.RENDER) ? FRONTEND_URL : "http://localhost:5050")
const OAUTH_STATE_TTL_SECONDS = 600

function cookieName(provider) {
    return `phyto_oauth_${provider}_state`
}

function callbackPath(provider) {
    return `/auth/${provider}/callback`
}

function secureCookie() {
    return process.env.NODE_ENV === "production" || Boolean(process.env.RENDER)
}

function writeStateCookie(res, provider, state, clear = false) {
    const secure = secureCookie() ? "; Secure" : ""
    const maxAge = clear ? 0 : OAUTH_STATE_TTL_SECONDS
    res.setHeader("Set-Cookie", `${cookieName(provider)}=${clear ? "" : state}; Path=${callbackPath(provider)}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`)
}

function readCookie(req, name) {
    const cookie = (req.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))
    return cookie ? cookie.slice(name.length + 1) : null
}

function redirectUri(provider) {
    return `${OAUTH_CALLBACK_BASE_URL}${callbackPath(provider)}`
}

function redirectWithError(res, provider, error) {
    writeStateCookie(res, provider, null, true)
    res.set("Cache-Control", "no-store")
    return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(error)}`)
}

async function redirectWithOAuthCode(res, user, provider) {
    const code = await createOAuthCode(dbo.getDb(), user._id)
    writeStateCookie(res, provider, null, true)
    res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" })
    return res.redirect(`${FRONTEND_URL}/?oauthCode=${encodeURIComponent(code)}`)
}

function startOAuth(res, provider, params) {
    const state = createOpaqueValue()
    writeStateCookie(res, provider, state)
    params.set("state", state)
}

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
        redirect_uri: redirectUri("google"),
        response_type: "code",
        scope: "openid profile email",
        access_type: "offline",
        prompt: "consent",
    })
    startOAuth(res, "google", params)
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

authRoutes.get("/auth/google/callback", async (req, res) => {
    const { code, state, error } = req.query

    if (error) return redirectWithError(res, "google", "google_cancelled")
    const expectedState = readCookie(req, cookieName("google"))
    if (!stateMatches(expectedState, state)) {
        return redirectWithError(res, "google", "oauth_state_invalid")
    }
    if (typeof code !== "string" || !code) {
        return redirectWithError(res, "google", "no_code")
    }

    try {
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri("google"),
            grant_type: "authorization_code",
        })

        const { access_token } = tokenRes.data

        const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        })

        const { id, email, name, picture, verified_email } = userRes.data
        if (verified_email !== true) throw new Error("Google account email is not verified")

        const user = await findOrCreateUser(
            { id, email, name, avatar: picture },
            "google"
        )

        return await redirectWithOAuthCode(res, user, "google")
    } catch (error) {
        logger.error({ erro: error.response?.data || error.message }, "[OAuth Google] Erro")
        return redirectWithError(res, "google", "google_failed")
    }
})

// ========== GITHUB ==========

authRoutes.get("/auth/github", (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri("github"),
        scope: "user:email",
    })
    startOAuth(res, "github", params)
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
})

authRoutes.get("/auth/github/callback", async (req, res) => {
    const { code, state, error } = req.query

    if (error) return redirectWithError(res, "github", "github_cancelled")
    const expectedState = readCookie(req, cookieName("github"))
    if (!stateMatches(expectedState, state)) {
        return redirectWithError(res, "github", "oauth_state_invalid")
    }
    if (typeof code !== "string" || !code) {
        return redirectWithError(res, "github", "no_code")
    }

    try {
        const tokenRes = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: redirectUri("github"),
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

        const primaryEmail = emailsRes.data.find(e => e.primary && e.verified)?.email
            || emailsRes.data.find(e => e.verified)?.email
        if (!primaryEmail) throw new Error("GitHub account has no verified email")

        const { id, name, avatar_url } = userRes.data

        const displayName = name || userRes.data.login

        const user = await findOrCreateUser(
            { id: String(id), email: primaryEmail, name: displayName, avatar: avatar_url },
            "github"
        )

        return await redirectWithOAuthCode(res, user, "github")
    } catch (error) {
        logger.error({ erro: error.response?.data || error.message }, "Erro no OAuth GitHub")
        return redirectWithError(res, "github", "github_failed")
    }
})

authRoutes.post("/auth/exchange", async (req, res) => {
    res.set("Cache-Control", "no-store")
    const code = req.body && req.body.code
    if (typeof code !== "string") return res.status(400).json({ mensagem: "Código de autorização ausente" })

    try {
        const consumed = await consumeOAuthCode(dbo.getDb().collection("oauth_codes"), code)
        if (!consumed) return res.status(401).json({ mensagem: "Código de autorização inválido ou expirado" })
        const user = await dbo.getDb().collection("users").findOne({ _id: consumed.userId })
        if (!user) return res.status(401).json({ mensagem: "Conta não encontrada" })

        const token = signToken({ userId: user._id, tipo: user.function, name: user.name || user.user, avatar: user.avatar || null })
        const refreshToken = await createSession(dbo.getDb(), user)
        return res.json({ token, refreshToken })
    } catch (error) {
        logger.error(error, "Erro ao trocar código OAuth")
        return res.status(500).json({ mensagem: "Não foi possível concluir o login social" })
    }
})

module.exports = authRoutes
module.exports.generateUsername = generateUsername
