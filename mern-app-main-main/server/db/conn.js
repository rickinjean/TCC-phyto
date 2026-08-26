const { MongoClient } = require("mongodb")

const Db = process.env.MONGODB_URI

if (!Db) {
    console.error("ERRO: MONGODB_URI não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const client = new MongoClient(Db)

var _db

module.exports = {
    connectToMongoDB: async function (callback) {
        try {
            await client.connect()
            _db = client.db("phytografia") // Nome do BANCO DE DADOS
            console.log("Conectado ao MongoDB.")
            
            return callback(null)
        } catch (error) {
            return callback(error)
        }
    },

    getDb: function () {
        return _db
    }
}
