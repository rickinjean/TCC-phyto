// Integração HTTP das rotas com Express real e persistência simulada em memória.
// Não exige MongoDB, credenciais de OAuth ou serviços externos.
process.env.JWT_SECRET = "test-access-secret-with-sufficient-length"
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-sufficient-length"
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/phytografia-test"
process.env.NODE_ENV = "test"

const test = require("node:test")
const assert = require("node:assert/strict")
const express = require("express")
const bcrypt = require("bcrypt")
const { ObjectId } = require("mongodb")
const dbo = require("../db/conn")
const { signToken } = require("../middleware/auth")

function makeDb() {
    const users = []
    const messages = []
    return {
        users,
        messages,
        collection(name) {
            if (name === "users") return {
                async findOne() { return null },
                async insertOne(document) {
                    const saved = { ...document, _id: `user-${users.length + 1}` }
                    users.push(saved)
                    return { insertedId: saved._id }
                },
            }
            if (name === "messages") return {
                async insertOne(document) {
                    const saved = { ...document, _id: new ObjectId() }
                    messages.push(saved)
                    return { insertedId: saved._id }
                },
                find() {
                    return {
                        sort() { return this },
                        async toArray() { return [...messages].reverse() },
                    }
                },
                async deleteOne({ _id }) {
                    const index = messages.findIndex(message => String(message._id) === String(_id))
                    if (index < 0) return { deletedCount: 0 }
                    messages.splice(index, 1)
                    return { deletedCount: 1 }
                },
            }
            throw new Error(`Coleção inesperada no teste: ${name}`)
        },
    }
}

async function startApp(t, db) {
    dbo.getDb = () => db
    const app = express()
    app.use(express.json())
    app.use("/api", require("../routes/messages"))
    app.use(require("../routes/user"))
    const server = await new Promise(resolve => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance))
    })
    t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())))
    return `http://127.0.0.1:${server.address().port}`
}

test("HTTP: cadastro valida senha e ignora tentativa de criar administrador", async t => {
    const db = makeDb()
    const base = await startApp(t, db)

    const invalid = await fetch(`${base}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "ana", senha: "fraca", function: "ADM" }),
    })
    assert.equal(invalid.status, 400)
    assert.equal(db.users.length, 0)

    const response = await fetch(`${base}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "ana", senha: "SenhaForte1!", function: "ADM" }),
    })
    assert.equal(response.status, 201)
    assert.equal(db.users.length, 1)
    assert.equal(db.users[0].function, "User")
    assert.notEqual(db.users[0].senha, "SenhaForte1!")
    assert.equal(await bcrypt.compare("SenhaForte1!", db.users[0].senha), true)
})

test("HTTP: mensagens validam entrada e restringem consulta ao papel ADM", async t => {
    const db = makeDb()
    const base = await startApp(t, db)

    const invalid = await fetch(`${base}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "Pessoa", email: "email-inválido", assunto: "Contato", mensagem: "Olá" }),
    })
    assert.equal(invalid.status, 400)

    const created = await fetch(`${base}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "Pessoa", email: "pessoa@example.com", assunto: "Contato", mensagem: "Olá" }),
    })
    assert.equal(created.status, 201)
    assert.equal(db.messages.length, 1)

    const anonymous = await fetch(`${base}/api/messages`)
    assert.equal(anonymous.status, 401)

    const userToken = signToken({ userId: "user-1", tipo: "User" })
    const forbidden = await fetch(`${base}/api/messages`, { headers: { Authorization: `Bearer ${userToken}` } })
    assert.equal(forbidden.status, 403)

    const adminToken = signToken({ userId: "admin-1", tipo: "ADM" })
    const listed = await fetch(`${base}/api/messages`, { headers: { Authorization: `Bearer ${adminToken}` } })
    assert.equal(listed.status, 200)
    assert.equal((await listed.json()).length, 1)

    const deleted = await fetch(`${base}/api/messages/${db.messages[0]._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(deleted.status, 200)
    assert.equal(db.messages.length, 0)
})
