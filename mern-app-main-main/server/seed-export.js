/*
 * Script de exportação das plantas do MongoDB para o plants-db.json
 *
 * Dois modos de uso (escolha um):
 *
 * 1) CONEXÃO DIRETA (requer MONGODB_URI no .env)
 *    node seed-export.js
 *    Conecta no banco, lê a coleção "plants" e grava em server/data/plants-db.json
 *
 * 2) EXPORTAÇÃO MANUAL (sem conexão — você exporta do Atlas Data Explorer)
 *    - Exporte a coleção "plants" do Atlas e salve o JSON num arquivo local:
 *        server/data/_export.json   (pode ser um array de documentos
 *                                    ou um objeto { "plants": [...] })
 *    - Rode:
 *        node seed-export.js --manual
 *    - O script converte para { "plants": [...] } e sobrescreve
 *      server/data/plants-db.json
 */
require("dotenv").config()
const fs = require("fs")
const path = require("path")

const DATA_DIR = path.join(__dirname, "data")
const OUTPUT = path.join(DATA_DIR, "plants-db.json")
const MANUAL_SRC = path.join(DATA_DIR, "_export.json")

function gravar(lista) {
    fs.writeFileSync(
        OUTPUT,
        JSON.stringify({ plants: lista }, null, 2) + "\n",
        "utf8"
    )
    console.log(`OK: ${lista.length} planta(s) gravada(s) em plants-db.json`)
}

async function viaConexao() {
    const { MongoClient } = require("mongodb")
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error(
            "ERRO: MONGODB_URI não definida no .env. Use o modo manual (--manual) ou defina a URI."
        )
        process.exit(1)
    }
    const client = new MongoClient(uri, {
        // Suporte a autenticação X.509, se informado via var de ambiente:
        // TLS_CERT_FILE=/caminho/para/certificado.pem
        ...(process.env.TLS_CERT_FILE
            ? { tlsCertificateKeyFile: process.env.TLS_CERT_FILE }
            : {})
    })
    try {
        await client.connect()
        const db = client.db("phytografia")
        const plantas = await db.collection("plants").find({}).toArray()
        gravar(plantas)
    } catch (err) {
        console.error("Falha ao conectar/exportar:", err.message)
        process.exit(1)
    } finally {
        await client.close()
    }
}

async function viaManual() {
    if (!fs.existsSync(MANUAL_SRC)) {
        console.error(
            `ERRO: arquivo ${MANUAL_SRC} não encontrado.\n` +
            "Exporte a coleção 'plants' do Atlas Data Explorer e salve como _export.json."
        )
        process.exit(1)
    }
    let conteudo = fs.readFileSync(MANUAL_SRC, "utf8")
    if (conteudo.charCodeAt(0) === 0xfeff) conteudo = conteudo.slice(1) // remove BOM
    const raw = JSON.parse(conteudo)
    const lista = Array.isArray(raw) ? raw : (raw.plants || [])
    if (!Array.isArray(lista) || lista.length === 0) {
        console.error("ERRO: o conteúdo de _export.json não contém plantas válidas.")
        process.exit(1)
    }
    gravar(lista)
}

const modo = process.argv.includes("--manual") ? "manual" : "conexao"

if (modo === "manual") {
    viaManual()
} else {
    viaConexao()
}
