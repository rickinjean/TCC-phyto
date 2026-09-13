/*
 * Script de limpeza dos dados do recurso de IA/KNN removido (Identificador,
 * Treinador, Gerir Modelos). Remove:
 *
 *   - Coleção "ai_models" (metadados dos modelos) do banco "phytografia"
 *   - Todos os arquivos do bucket GridFS "models" (model.json + .bin chunks)
 *
 * Uso (requer MONGODB_URI no .env da pasta server):
 *   node limpar-ia.js
 */
require("dotenv").config()
const { MongoClient } = require("mongodb")
const logger = require("./logger")

const Db = process.env.MONGODB_URI
if (!Db) {
    logger.error("ERRO: MONGODB_URI não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

async function main() {
    const client = new MongoClient(Db)
    try {
        await client.connect()
        const db = client.db("phytografia")
        logger.info("Conectado ao MongoDB")

        const colInfo = await db.listCollections({ name: "ai_models" }).next()
        if (colInfo) {
            await db.collection("ai_models").drop()
            logger.info("Coleção ai_models removida")
        } else {
            logger.info("Coleção ai_models não existia — nada a fazer")
        }

        const bucket = new (require("mongodb").GridFSBucket)(db, { bucketName: "models" })
        const files = await db.collection("models.files").find({}).project({ _id: 1 }).toArray()
        if (files.length === 0) {
            logger.info("Bucket GridFS 'models' vazio — nada a fazer")
        } else {
            for (const f of files) {
                await bucket.delete(f._id)
            }
            logger.info({ qtd: files.length }, "Arquivos do bucket GridFS 'models' removidos")
        }

        logger.info("Limpeza concluída")
    } catch (error) {
        logger.error(error, "Falha na limpeza dos dados de IA")
        process.exitCode = 1
    } finally {
        await client.close()
    }
}

main()