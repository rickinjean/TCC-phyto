const test = require("node:test")
const assert = require("node:assert/strict")
const { escapeRegex, normalizarDistribuicao, plantaCorpo } = require("../utils")

test("escapeRegex trata texto de busca como texto literal", () => {
    assert.equal(escapeRegex("ipê (var. 2)+"), "ipê \\(var\\. 2\\)\\+")
    assert.equal(new RegExp(escapeRegex("a+b")).test("a+b"), true)
    assert.equal(new RegExp(escapeRegex("a+b")).test("aaab"), false)
})

test("normaliza distribuição, remove códigos inválidos e duplicados e dá prioridade a nativa", () => {
    assert.deepEqual(normalizarDistribuicao({
        nativa: ["bra", "BRA", "XXX", 42],
        cultivada: ["BRA", "ARG", "ARG"],
        fonte: "  Flora local  ",
    }), {
        nativa: ["BRA"],
        cultivada: ["ARG"],
        fonte: "Flora local",
    })
})

test("distribuição malformada vira estrutura vazia e texto de fonte respeita limite", () => {
    assert.deepEqual(normalizarDistribuicao("não é JSON"), { nativa: [], cultivada: [], fonte: "" })
    assert.equal(normalizarDistribuicao({ fonte: "x".repeat(200) }).fonte.length, 160)
})

test("plantaCorpo inclui os campos conhecidos e normaliza distribuição", () => {
    const body = plantaCorpo({ body: {
        name: "Ipê-amarelo",
        campoArbitrario: "não persistir",
        distribuicao: { nativa: ["BRA"], cultivada: ["BRA", "ARG"] },
    } })
    assert.equal(body.name, "Ipê-amarelo")
    assert.equal(Object.hasOwn(body, "campoArbitrario"), false)
    assert.deepEqual(body.distribuicao, { nativa: ["BRA"], cultivada: ["ARG"], fonte: "" })
})
