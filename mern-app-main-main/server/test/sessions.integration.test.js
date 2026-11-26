// Testa a rota HTTP de refresh com Express e um repositório em memória.
// O fake reproduz findOneAndDelete como operação atômica do MongoDB.
process.env.JWT_SECRET = "test-access-secret-with-sufficient-length"
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-sufficient-length"
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/phytografia-test"
process.env.NODE_ENV = "test"

const test = require("node:test")
const assert = require("node:assert/strict")
const crypto = require("node:crypto")
const express = require("express")
const { ObjectId } = require("mongodb")
const dbo = require("../db/conn")
const { signRefreshToken } = require("../middleware/auth")
const { hashValue } = require("../oauthSecurity")

test("HTTP: apenas uma requisição concorrente consome e renova a mesma sessão", async t => {
    const userId = new ObjectId()
    const refreshToken = signRefreshToken({ userId, tipo: "User", name: "Teste" })
    const originalSession = {
        _id: new ObjectId(),
        tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
        userId,
        expiresAt: new Date(Date.now() + 60_000),
    }
    let storedSession = originalSession
    const createdSessions = []

    dbo.getDb = () => ({
        collection(name) {
            if (name === "sessions") return {
                async findOneAndDelete(filter) {
                    if (!storedSession
                        || storedSession.tokenHash !== filter.tokenHash
                        || storedSession.expiresAt <= filter.expiresAt.$gt) return { value: null }
                    const consumed = storedSession
                    storedSession = null
                    return { value: consumed }
                },
                async insertOne(session) {
                    createdSessions.push(session)
                    return { insertedId: new ObjectId() }
                },
            }
            if (name === "users") return {
                async findOne(query) {
                    return String(query._id) === String(userId)
                        ? { _id: userId, user: "teste", name: "Teste", function: "User" }
                        : null
                },
            }
            throw new Error(`Coleção inesperada: ${name}`)
        },
    })

    const app = express()
    app.use(express.json())
    app.use(require("../routes/sessions"))
    const server = await new Promise(resolve => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance))
    })
    t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())))
    const url = `http://127.0.0.1:${server.address().port}/auth/refresh`
    const request = () => fetch(url, { method: "POST", headers: { Authorization: `Bearer ${refreshToken}` } })

    const responses = await Promise.all([request(), request()])
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 401])
    assert.equal(createdSessions.length, 1)
    const success = responses.find(response => response.status === 200)
    const body = await success.json()
    assert.ok(body.token)
    assert.ok(body.refreshToken)
    assert.notEqual(createdSessions[0].tokenHash, hashValue(refreshToken))
})
