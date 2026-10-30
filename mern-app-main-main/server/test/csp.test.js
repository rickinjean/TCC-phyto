const test = require("node:test")
const assert = require("node:assert/strict")
const { parseConnectSources } = require("../csp")

test("CSP aceita apenas origens HTTP(S) explícitas, sem caminhos ou curingas", () => {
    assert.deepEqual(
        parseConnectSources("https://api.example.com, http://localhost:5050, https://bad.example/path, * , javascript:alert(1)"),
        ["https://api.example.com", "http://localhost:5050"]
    )
    assert.deepEqual(parseConnectSources(""), [])
})
