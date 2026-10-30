const crypto = require("crypto")

const STATE_BYTES = 32
const CODE_BYTES = 32
const CODE_TTL_MS = 2 * 60 * 1000

function createOpaqueValue(bytes = STATE_BYTES) {
    return crypto.randomBytes(bytes).toString("base64url")
}

function stateMatches(expected, received) {
    if (typeof expected !== "string" || typeof received !== "string") return false
    const expectedBuffer = Buffer.from(expected)
    const receivedBuffer = Buffer.from(received)
    return expectedBuffer.length === receivedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}

function hashValue(value) {
    return crypto.createHash("sha256").update(value).digest("hex")
}

async function createOAuthCode(db, userId) {
    const code = createOpaqueValue(CODE_BYTES)
    await db.collection("oauth_codes").insertOne({
        codeHash: hashValue(code),
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
    })
    return code
}

async function consumeOAuthCode(collection, code) {
    if (typeof code !== "string" || !/^[A-Za-z0-9_-]{40,50}$/.test(code)) return null
    const result = await collection.findOneAndDelete({
        codeHash: hashValue(code),
        expiresAt: { $gt: new Date() },
    })
    return result.value || null
}

module.exports = { CODE_TTL_MS, createOpaqueValue, stateMatches, hashValue, createOAuthCode, consumeOAuthCode }
