process.env.JWT_SECRET = "test-access-secret-with-sufficient-length"
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-sufficient-length"

const test = require("node:test")
const assert = require("node:assert/strict")
const jwt = require("jsonwebtoken")
const { authenticateToken, authorizeRoles, signToken, verifyRefreshToken, signRefreshToken } = require("../middleware/auth")

function responseMock() {
    return {
        statusCode: null,
        body: null,
        status(code) { this.statusCode = code; return this },
        json(body) { this.body = body; return this },
    }
}

function authenticate(token) {
    return new Promise(resolve => {
        const req = { headers: token ? { authorization: `Bearer ${token}` } : {} }
        const res = responseMock()
        authenticateToken(req, res, () => resolve({ req, res, next: true }))
        setImmediate(() => resolve({ req, res, next: false }))
    })
}

test("autenticação rejeita ausência de token e assinatura inválida", async () => {
    const missing = await authenticate(null)
    assert.equal(missing.next, false)
    assert.equal(missing.res.statusCode, 401)
    assert.equal(missing.res.body.mensagem, "Token não enviado")

    const forged = jwt.sign({ tipo: "ADM" }, "wrong-secret")
    const invalid = await authenticate(forged)
    assert.equal(invalid.next, false)
    assert.equal(invalid.res.statusCode, 401)
})

test("autenticação aceita token assinado e disponibiliza claims para a rota", async () => {
    const token = signToken({ userId: "u-1", tipo: "User" })
    const result = await authenticate(token)
    assert.equal(result.next, true)
    assert.equal(result.req.user.userId, "u-1")
    assert.equal(result.req.user.tipo, "User")
})

test("autorização distingue administrador de usuário comum", () => {
    const middleware = authorizeRoles("ADM")
    const denied = responseMock()
    let called = false
    middleware({ user: { tipo: "User" }, method: "GET", originalUrl: "/admin" }, denied, () => { called = true })
    assert.equal(called, false)
    assert.equal(denied.statusCode, 403)

    const allowed = responseMock()
    middleware({ user: { tipo: "ADM" } }, allowed, () => { called = true })
    assert.equal(called, true)
})

test("refresh token usa segredo separado e rejeita token assinado com o segredo de acesso", async () => {
    const refresh = signRefreshToken({ userId: "u-1", tipo: "User" })
    const decoded = await verifyRefreshToken(refresh)
    assert.equal(decoded.userId, "u-1")

    const accessToken = signToken({ userId: "u-1" })
    await assert.rejects(verifyRefreshToken(accessToken))
})
