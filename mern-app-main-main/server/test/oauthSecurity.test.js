const test = require("node:test")
const assert = require("node:assert/strict")
const { createOpaqueValue, stateMatches, createOAuthCode, consumeOAuthCode } = require("../oauthSecurity")

test("OAuth state é aleatório e só corresponde ao valor exato", () => {
    const state = createOpaqueValue()
    assert.match(state, /^[A-Za-z0-9_-]{40,50}$/)
    assert.equal(stateMatches(state, state), true)
    assert.equal(stateMatches(state, `${state}x`), false)
    assert.equal(stateMatches(state, null), false)
})

test("código OAuth é armazenado como hash e consumido apenas uma vez", async () => {
    let stored
    const collection = {
        async insertOne(document) { stored = document },
        async findOneAndDelete(filter) {
            if (!stored || stored.codeHash !== filter.codeHash || stored.expiresAt <= filter.expiresAt.$gt) return { value: null }
            const value = stored
            stored = null
            return { value }
        },
    }
    const db = { collection: () => collection }
    const userId = "user-123"
    const code = await createOAuthCode(db, userId)

    assert.notEqual(stored.codeHash, code)
    assert.equal(stored.userId, userId)
    assert.ok(stored.expiresAt > stored.createdAt)

    const consumed = await consumeOAuthCode(collection, code)
    assert.equal(consumed.userId, userId)
    assert.equal(await consumeOAuthCode(collection, code), null)
})

test("código malformado ou expirado não pode ser trocado", async () => {
    let stored
    const collection = {
        async insertOne(document) { stored = document },
        async findOneAndDelete(filter) {
            if (!stored || stored.codeHash !== filter.codeHash || stored.expiresAt <= filter.expiresAt.$gt) return { value: null }
            const value = stored
            stored = null
            return { value }
        },
    }
    assert.equal(await consumeOAuthCode(collection, "bad"), null)
    const expiredCode = await createOAuthCode({ collection: () => collection }, "user-expired")
    stored.expiresAt = new Date(Date.now() - 1000)
    assert.equal(await consumeOAuthCode(collection, expiredCode), null)
})
