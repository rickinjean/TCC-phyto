const { MongoClient } = require("mongodb")
const logger = require("../logger")

const Db = process.env.MONGODB_URI

if (!Db) {
    logger.error("ERRO: MONGODB_URI não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const client = new MongoClient(Db)

var _db

// Remove índices legados de users.user/users.email cuja spec divirja do
// formato parcial atual (ex.: email_1 único completo criado no deploy que
// crashou). Idempotente: a cada boot, se o índice já estiver correto, não faz
// nada. Janela entre drop e recriação é de milissegundos.
async function alignUniqueIndexes(users) {
    try {
        const existing = await users.indexes()
        const desejados = [
            { key: { user: 1 }, partial: { user: { $type: "string" } } },
            { key: { email: 1 }, partial: { email: { $type: "string" } } },
        ]
        for (const def of desejados) {
            const key = JSON.stringify(def.key)
            const idx = existing.find(i => JSON.stringify(i.key) === key)
            if (!idx) continue
            const confere = idx.partialFilterExpression &&
                JSON.stringify(idx.partialFilterExpression) === JSON.stringify(def.partial)
            if (!idx.unique || !confere) {
                await users.dropIndex(idx.name)
                logger.info({ index: idx.name }, "Índice legado divergente removido para recriação parcial")
            }
        }
    } catch (error) {
        logger.warn({ err: error.message }, "Falha ao alinhar índices existentes — prosseguindo")
    }
}

async function createIndexes(db) {
    const users = db.collection("users")

    // Índices únicos PARCIAIS: aplicam unicidade apenas em documentos onde o
    // campo existe e é string. Registros legados com `user`/`email` ausentes
    // (null) não entram no índice — sem isso, o build falha com E11000
    // (dup key: { user: null }).
    await alignUniqueIndexes(users)

    const tasks = [
        users.createIndex(
            { user: 1 },
            { unique: true, partialFilterExpression: { user: { $type: "string" } } }
        ),
        users.createIndex(
            { email: 1 },
            { unique: true, partialFilterExpression: { email: { $type: "string" } } }
        ),
        db.collection("sessions").createIndex({ tokenHash: 1 }),
        db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("userlist_items").createIndex({ listId: 1 }),
        db.collection("userlist_items").createIndex({ plantId: 1 }),
        db.collection("favorites").createIndex({ userId: 1, plantId: 1 }),
        db.collection("suggestions").createIndex({ userId: 1 }),
        db.collection("suggestions").createIndex({ status: 1 }),
        db.collection("messages").createIndex({ createdAt: -1 }),
    ]

    // Um índice que falhe não pode derrubar o boot: registramos o aviso e
    // seguimos. Índices únicos com dados sujos já existentes (ex.: usernames
    // duplicados de verdade) ficam pendentes de limpeza manual, mas o serviço sobe.
    const results = await Promise.allSettled(tasks)
    results.forEach((r, i) => {
        if (r.status === "fulfilled") {
            logger.info({ index: i }, "Índice criado/verificado")
        } else {
            logger.warn({ index: i, err: r.reason && r.reason.message }, "Falha ao criar índice — ignorado")
        }
    })
}

module.exports = {
    connectToMongoDB: async function (callback) {
        try {
            await client.connect()
            _db = client.db("phytografia") // Nome do BANCO DE DADOS
            logger.info("Conectado ao MongoDB")

            await createIndexes(_db)

            return callback(null)
        } catch (error) {
            return callback(error)
        }
    },

    getDb: function () {
        return _db
    }
}
