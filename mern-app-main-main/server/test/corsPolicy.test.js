const test = require("node:test")
const assert = require("node:assert/strict")
const { normalizeOrigin, isAllowedOrigin, isSameOriginRequest } = require("../corsPolicy")

test("normaliza origens e permite somente as origens configuradas ou requisições sem Origin", () => {
    const allowlist = ["https://app.example.com", "http://localhost:3000"]
    assert.equal(normalizeOrigin(" HTTPS://APP.EXAMPLE.COM/ "), "https://app.example.com")
    assert.equal(isAllowedOrigin("https://app.example.com/", allowlist), true)
    assert.equal(isAllowedOrigin("https://evil.example", allowlist), false)
    assert.equal(isAllowedOrigin(undefined, allowlist), true)
})

test("detecta mesma origem com req e Origin, sem depender de variável fora do escopo", () => {
    const req = { protocol: "https", get: name => name.toLowerCase() === "host" ? "app.example.com" : undefined }
    assert.equal(isSameOriginRequest(req, "https://app.example.com"), true)
    assert.equal(isSameOriginRequest(req, "https://other.example"), false)
    assert.equal(isSameOriginRequest(req, undefined), false)
})
