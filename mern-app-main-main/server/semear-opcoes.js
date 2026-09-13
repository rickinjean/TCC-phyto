/*
 * Semeador das coleções de opções dos selects do formulário de planta.
 *
 * Uso (requer MONGODB_URI no .env da pasta server):
 *   node semear-opcoes.js
 *
 * Para cada coleção de campo que não existe no banco, insere as opções
 * padrão em português (upsert por nome — rodar mais de uma vez é seguro).
 */
require("dotenv").config()

const OPCOES = {
    fruit: ["Aquênio", "Baga", "Cápsula", "Cariopse", "Drupa", "Legume", "Noz", "Pomo", "Pseudofruto"],
    origin: ["Brasil", "África", "América do Norte", "América do Sul", "Ásia", "Europa", "Oceania"],
    propagation: ["Sementes", "Estacas", "Divisão de touceiras", "Alporquia", "Enxertia", "Bulbos"],
    dificulty: ["Baixa", "Média", "Alta"],
    height: ["Baixo (até 30 cm)", "Médio (30–100 cm)", "Alto (100–150 cm)", "Arbóreo (>150 cm)"],
    flowercolor: ["Branca", "Amarela", "Laranja", "Rosa", "Vermelha", "Lilás/Roxa", "Azul", "Verde", "Multicolorida"],
    foliage: ["Aromática", "Caduca", "Perene", "Sempre-verde", "Ornamental", "Variegada"],
    flowering: ["Primavera", "Verão", "Outono", "Inverno", "Primavera/Verão", "Verão/Outono", "Quase o ano todo"],
    light: ["Sol pleno", "Meia-sombra", "Sombra", "Luz difusa"],
    manha: ["Início da manhã", "Meio da manhã", "Fim da tarde", "Noite"],
    amount: ["50–100 ml", "200–500 ml", "500 ml–1 L", "1–2 L"],
    frequency: ["Semanal", "Quinzenal", "Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"],
    NPK: ["NPK 4-14-8", "NPK 10-10-10", "NPK 14-14-14", "NPK 20-20-20", "Orgânico"],
    prevention: ["Básica", "Média", "Avançada"],
    monitoring: ["Diário", "Semanal", "Quinzenal", "Mensal"],
    idealTemperature: ["10–20 °C", "15–25 °C", "18–24 °C", "20–30 °C"],
    iluminosity: ["2–4 horas", "4–6 horas", "6–8 horas", "8 ou mais horas"],
    protection: ["Nenhuma", "Quebra-vento", "Telado", "Estufa", "Mulching"],
}

async function semear() {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        console.error("ERRO: MONGODB_URI não definida no .env da pasta server.")
        process.exit(1)
    }
    const { MongoClient } = require("mongodb")
    const client = new MongoClient(uri)
    try {
        await client.connect()
        const db = client.db("phytografia")
        let criadas = 0
        let opcoes = 0

        for (const [colecao, nomes] of Object.entries(OPCOES)) {
            const doc = nomes.map(nome => ({ name: nome }))
            const result = await db.collection(colecao).bulkWrite(
                doc.map(d => ({
                    updateOne: { filter: { name: d.name }, update: { $setOnInsert: d }, upsert: true },
                })),
                { ordered: false }
            )
            opcoes += result.upsertedCount
            criadas++
        }

        console.log(`OK: ${criadas} coleções de opções, ${opcoes} opção(ões) inserida(s) (duplicadas ignoradas)`)
    } catch (err) {
        console.error("Falha ao semear:", err.message)
        process.exit(1)
    } finally {
        await client.close()
    }
}

semear()