/*
 * Migração: coordenadas geográficas das coletas botânicas.
 *
 * Adiciona os campos latitude/longitude (Number | null) aos documentos da
 * coleção "plants" e cria o índice de apoio. O MongoDB não possui
 * Decimal(9,6); a precisão de 6 casas é garantida pela API (utils.js).
 *
 * Uso:
 *   cd server
 *   npm run migrate:coordinates
 *
 * É idempotente: pode ser executada mais de uma vez sem efeitos colaterais.
 */
require("dotenv").config()
const { MongoClient } = require("mongodb")

const DB_NAME = "phytografia"
const CASAS = 6

function normalizarValor(valor) {
    if (valor === undefined || valor === null) return null
    if (typeof valor === "number") {
        return Number.isFinite(valor) ? Number(valor.toFixed(CASAS)) : null
    }
    const texto = String(valor).trim().replace(",", ".")
    if (!texto) return null
    const numero = Number(texto)
    return Number.isFinite(numero) ? Number(numero.toFixed(CASAS)) : null
}

async function main() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error("ERRO: MONGODB_URI não está definida. Crie/ajuste o arquivo .env em server/.")
        process.exit(1)
    }

    const client = new MongoClient(uri, {
        ...(process.env.TLS_CERT_FILE
            ? { tlsCertificateKeyFile: process.env.TLS_CERT_FILE }
            : {}),
    })

    try {
        await client.connect()
        const db = client.db(DB_NAME)
        const plants = db.collection("plants")

        // 1) Documentos legados sem os campos passam a ter null explícito.
        const semCampos = {
            $or: [
                { latitude: { $exists: false } },
                { longitude: { $exists: false } },
            ],
        }
        const inicial = await plants.updateMany(semCampos, {
            $set: { latitude: null, longitude: null },
        })

        // 2) Normaliza eventuais valores gravados como texto em versões antigas.
        const cursor = plants.find({
            $or: [
                { latitude: { $type: "string" } },
                { longitude: { $type: "string" } },
            ],
        })
        let normalizados = 0
        for await (const doc of cursor) {
            const latitude = normalizarValor(doc.latitude)
            const longitude = normalizarValor(doc.longitude)
            await plants.updateOne(
                { _id: doc._id },
                { $set: { latitude, longitude } }
            )
            normalizados++
        }

        // 3) Índice de apoio (só documentos com coordenadas numéricas válidas).
        //    Mesmas opções usadas em db/conn.js para não conflitar no boot.
        await plants.createIndex(
            { latitude: 1, longitude: 1 },
            {
                partialFilterExpression: {
                    latitude: { $type: "number" },
                    longitude: { $type: "number" },
                },
            }
        )

        const total = await plants.countDocuments()
        const comCoordenadas = await plants.countDocuments({
            latitude: { $type: "number" },
            longitude: { $type: "number" },
        })

        console.log(
            `OK: ${inicial.modifiedCount} documento(s) padronizado(s) com null; ` +
            `${normalizados} valor(es) texto normalizado(s); ` +
            `${comCoordenadas}/${total} planta(s) com coordenadas.`
        )
        console.log("Índice { latitude: 1, longitude: 1 } verificado.")
    } catch (erro) {
        console.error("Falha na migração de coordenadas:", erro.message)
        process.exitCode = 1
    } finally {
        await client.close()
    }
}

main()
