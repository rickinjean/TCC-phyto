const { MongoClient } = require("mongodb")
const logger = require("../logger")

const Db = process.env.MONGODB_URI

if (!Db) {
    logger.error("ERRO: MONGODB_URI não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const client = new MongoClient(Db)

var _db

const INDEX_SPECS = [
    { collection: "users", indexes: [
        { key: { user: 1 }, options: { unique: true, partialFilterExpression: { user: { $type: "string" } } } },
        { key: { email: 1 }, options: { unique: true, partialFilterExpression: { email: { $type: "string" } } } },
    ] },
    { collection: "sessions", indexes: [
        { key: { tokenHash: 1 }, options: {} },
        { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
    ] },
    { collection: "userlist_items", indexes: [
        { key: { listId: 1 }, options: {} },
        { key: { plantId: 1 }, options: {} },
    ] },
    { collection: "favorites", indexes: [
        { key: { userId: 1, plantId: 1 }, options: {} },
    ] },
    { collection: "suggestions", indexes: [
        { key: { userId: 1 }, options: {} },
        { key: { status: 1 }, options: {} },
    ] },
    { collection: "messages", indexes: [
        { key: { createdAt: -1 }, options: {} },
    ] },
]

// Compara um índice existente com a spec desejada pela key pattern e pelas
// options funcionais (unique, partialFilterExpression, expireAfterSeconds).
// Indices únicos PARCIAIS de users/user e users/email: aplicam unicidade só
// em documentos onde o campo existe e é string; registros legados com o campo
// ausente (null) não entram — sem isso o boot falharia com E11000.
function indexMatches(existingIdx, spec) {
    const op = spec.options || {}
    if (JSON.stringify(existingIdx.key) !== JSON.stringify(spec.key)) return false
    if (!!existingIdx.unique !== !!op.unique) return false
    const temPartial = !!existingIdx.partialFilterExpression
    if (temPartial !== !!op.partialFilterExpression) return false
    if (temPartial && JSON.stringify(existingIdx.partialFilterExpression) !== JSON.stringify(op.partialFilterExpression)) return false
    if ((existingIdx.expireAfterSeconds ?? 0) !== (op.expireAfterSeconds ?? 0)) return false
    return true
}

// Sincroniza o conjunto de índices declarado em INDEX_SPECS. Cria apenas os
// que não existem e recria os que existem com spec divergente (ex.: email_1
// único completo criado em deploy que crashou). Em estado estável faz só
// listIndexes, sem comandos de criação redundantes.
async function syncIndexes(db) {
    const cria = []
    let verificadas = 0
    let removidas = 0

    for (const def of INDEX_SPECS) {
        const col = db.collection(def.collection)
        const existing = await col.listIndexes().toArray().catch(() => [])
        for (const spec of def.indexes) {
            const key = JSON.stringify(spec.key)
            const idx = existing.find(i => JSON.stringify(i.key) === key)
            if (!idx) {
                cria.push(col.createIndex(spec.key, spec.options))
                continue
            }
            if (indexMatches(idx, spec)) {
                verificadas++
            } else {
                await col.dropIndex(idx.name).catch(() => {})
                removidas++
                cria.push(col.createIndex(spec.key, spec.options))
            }
        }
    }

    // Um índice que falhe não pode derrubar o boot: registramos o aviso e
    // seguimos. Índices únicos com dados sujos já existentes (ex.: usernames
    // duplicados de verdade) ficam pendentes de limpeza manual, mas o serviço sobe.
    const results = await Promise.allSettled(cria)
    const criadas = results.filter(r => r.status === "fulfilled").length
    results.forEach((r, i) => {
        if (r.status === "rejected") {
            logger.warn({ index: i, err: r.reason && r.reason.message }, "Falha ao criar índice — ignorado")
        }
    })
    logger.info({ criadas, removidas, verificadas }, "Índices sincronizados")
}

module.exports = {
    connectToMongoDB: async function (callback) {
        try {
            await client.connect()
            _db = client.db("phytografia") // Nome do BANCO DE DADOS
            logger.info("Conectado ao MongoDB")

            await syncIndexes(_db)

            return callback(null)
        } catch (error) {
            return callback(error)
        }
    },

    getDb: function () {
        return _db
    }
}
