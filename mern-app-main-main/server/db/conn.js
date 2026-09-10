const { MongoClient } = require("mongodb")
const logger = require("../logger")

const Db = process.env.MONGODB_URI

if (!Db) {
    logger.error("ERRO: MONGODB_URI não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const client = new MongoClient(Db)

var _db

async function createIndexes(db) {
    await Promise.all([
        db.collection("users").createIndex({ user: 1 }, { unique: true }),
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("sessions").createIndex({ tokenHash: 1 }),
        db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("userlist_items").createIndex({ listId: 1 }),
        db.collection("userlist_items").createIndex({ plantId: 1 }),
        db.collection("favorites").createIndex({ userId: 1, plantId: 1 }),
        db.collection("suggestions").createIndex({ userId: 1 }),
        db.collection("suggestions").createIndex({ status: 1 }),
        db.collection("messages").createIndex({ createdAt: -1 }),
    ])
    logger.info("Índices do banco criados/verificados")
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
