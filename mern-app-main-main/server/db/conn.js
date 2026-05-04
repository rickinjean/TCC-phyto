const { MongoClient } = require("mongodb")

//const Db = 'mongodb+srv://rickzin:phyto@cluster0.6pqsfbl.mongodb.net/?appName=Cluster0'
const Db = "mongodb://rickzin:phyto@ac-wsibqzi-shard-00-00.6pqsfbl.mongodb.net:27017,ac-wsibqzi-shard-00-01.6pqsfbl.mongodb.net:27017,ac-wsibqzi-shard-00-02.6pqsfbl.mongodb.net:27017/?ssl=true&replicaSet=atlas-a8v6i8-shard-0&authSource=admin&appName=Cluster0"

const client = new MongoClient(Db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

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
