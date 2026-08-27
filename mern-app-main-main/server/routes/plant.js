const express = require("express")
const plantRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const axios = require("axios")

// Importar o multer e o path para gerir o upload de ficheiros
const multer = require("multer")
const path = require("path")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Configurar o armazenamento dos ficheiros localmente
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "uploads"))
    },
    filename: function (req, file, cb) {
        // Gera um nome único para o ficheiro usando timestamp + random para evitar colisões
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedMimes = ["image/jpeg", "image/pjpeg", "image/png", "image/webp", "image/gif"]
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Tipo de arquivo não permitido. Envie apenas imagens (JPG, PNG, WebP, GIF)."))
        }
    }
})

/* ==================================================
   LISTAR PLANTAS (com filtros opcionais)
================================================== */
plantRoutes.route("/plant").get(async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const { origin, flowercolor, light, water, soil, toxicity, dificulty, type, search } = req.query
        const filter = {}
        if (origin) filter.origin = origin
        if (flowercolor) filter.flowercolor = flowercolor
        if (light) filter.light = light
        if (water) filter.water = water
        if (soil) filter.soil = soil
        if (toxicity) filter.toxicity = toxicity
        if (dificulty) filter.dificulty = dificulty
        if (type) filter.type = type
        if (search) {
            const safeRegex = new RegExp(escapeRegex(search), "i")
            filter.$or = [
                { name: safeRegex },
                { scientificName: safeRegex }
            ]
        }

        const result = await db_connect.collection("plants").find(filter).toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   SUGESTÃO DE PLANTA VIA MÚLTIPLAS APIs GRATUITAS
   Combina: banco local + GBIF + Trefle + Wikipedia + Perenual
   Preenche o máximo de campos possível a partir do nome
================================================== */
const pathData = require("path")
let localPlants = []
try {
    localPlants = require(pathData.join(__dirname, "..", "data", "plants-db.json")).plants || []
} catch (e) {
    console.warn("[plants-db] aviso: não foi possível carregar o banco local:", e.message)
}

// Lista de todos os campos que podem ser preenchidos
const SUGGEST_FIELDS = [
    "name", "scientificName", "simpleDescription", "description",
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
    "Filo", "Classe", "Ordem", "Family", "Genero", "Especie",
    "height", "flowercolor", "foliage", "flowering",
    "light", "water", "size", "soil",
    "watering", "fertilizing", "pruning", "pests",
    "manha", "amount", "frequency", "NPK", "season", "tools", "prevention", "monitoring",
    "planting", "exhibition", "maintenance", "station", "spacing",
    "iluminosity", "protection", "idealTemperature", "tolerance"
]

function normalizeStr(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

// Mapeia Trefle light (0-10) -> nossos enums de luz
function trefleLightToValue(light) {
    if (light == null) return ""
    if (light >= 6) return "Sol pleno"
    if (light >= 3) return "Penumbra"
    return "Sombra"
}

// Mapeia Trefle bloom_months (jun, jul...) -> nossa estação
function trefleBloomToValue(months) {
    if (!Array.isArray(months) || months.length === 0) return ""
    const monthNums = months.map(m => new Date(`${m}-01`).getMonth() + 1)
    const has = (a, b) => monthNums.some(n => n >= a && n <= b)
    if (has(9, 12)) return "Primavera/Verão"
    if (has(6, 8)) return "Verão/Outono"
    if (has(3, 5)) return "Outono/Inverno"
    if (has(12, 2)) return "Verão/Outono"
    return "Primavera/Verão"
}

// Mapeia growth_habit -> tipo de planta
function trefleHabitToType(habit) {
    const h = normalizeStr(habit)
    if (!h) return ""
    if (h.includes("tree")) return "Árvore"
    if (h.includes("shrub")) return "Arbusto"
    if (h.includes("forb") || h.includes("herb")) return "Erva"
    if (h.includes("vine")) return "Trepadeira"
    return ""
}

// Mapeia cor da flor do Trefle/Wikipedia -> nossas cores
function mapFlowerColor(color) {
    const c = normalizeStr(color)
    if (!c) return ""
    if (c.includes("red")) return "Vermelho"
    if (c.includes("purple") || c.includes("violet") || c.includes("magenta")) return "Rosa ou roxo"
    if (c.includes("pink")) return "Rosa"
    if (c.includes("yellow")) return "Amarelo"
    if (c.includes("white")) return "Branco puro"
    if (c.includes("blue")) return "Azul"
    if (c.includes("orange")) return "Laranja"
    if (c.includes("green")) return "Verde"
    if (c.includes("red")) return "Vermelho"
    return ""
}

// Resolve um claim do Wikidata (pega o rótulo da entidade externa não resolve, então retorna o id)
function pickClaimValue(claims, prop) {
    const claim = claims && claims[prop] && claims[prop][0]
    const v = claim && claim.mainsnak && claim.mainsnak.datavalue && claim.mainsnak.datavalue.value
    return v || null
}

function calculateMatchScore(record, q) {
    const nq = normalizeStr(q)
    let score = 0
    if (normalizeStr(record.name) === nq) score += 100
    else if (normalizeStr(record.name).includes(nq) || nq.includes(normalizeStr(record.name))) score += 70
    if (normalizeStr(record.scientificName) === nq) score += 100
    else if (normalizeStr(record.scientificName).includes(nq)) score += 60
    return score
}

function countFilled(fields) {
    return SUGGEST_FIELDS.filter(f => fields[f] && String(fields[f]).trim() !== "").length
}

// --- GBIF: taxonomia (free, sem chave) ---
async function queryGbif(q) {
    const gbif = axios.create({ timeout: 20000 })
    let tax = null
    const matchRes = await gbif.get("https://api.gbif.org/v1/species/match", { params: { name: q } }).catch(() => null)
    const m = matchRes?.data
    if (m && m.phylum && m.rank && ["SPECIES", "SUBSPECIES", "VARIETY", "GENUS"].includes(m.rank)) {
        tax = {
            Filo: m.phylum || "",
            Classe: m.class || "",
            Ordem: m.order || "",
            Family: m.family || "",
            Genero: m.genus || "",
            Especie: m.species || m.canonicalName || "",
            scientificName: m.scientificName || m.canonicalName || ""
        }
    }
    if (!tax || !tax.Filo) {
        const searchRes = await gbif.get("https://api.gbif.org/v1/species/search", { params: { q, limit: 1 } }).catch(() => null)
        const s = searchRes?.data?.results?.[0]
        if (s && s.phylum) {
            tax = {
                Filo: s.phylum || "",
                Classe: s.class || "",
                Ordem: s.order || "",
                Family: s.family || "",
                Genero: s.genus || "",
                Especie: s.species || s.canonicalName || "",
                scientificName: s.scientificName || s.canonicalName || ""
            }
        }
    }
    return tax
}

// --- Trefle: dados botânicos (requer token) ---
async function queryTrefle(q) {
    const token = process.env.TREFLE_TOKEN
    if (!token) return null
    const api = axios.create({ timeout: 20000 })
    try {
        const search = await api.get("https://trefle.io/api/v1/species/search", { params: { q, token } })
        const list = (search.data && search.data.data) || []
        const match = list.find(r => normalizeStr(r.scientific_name).includes(normalizeStr(q).split(" ")[0])) || list[0]
        if (!match) return null
        let slug = match.slug
        // Se o primeiro não for o mais relevante, tenta o primeiro da lista geral
        const detail = await api.get(`https://trefle.io/api/v1/species/${slug}`, { params: { token } }).catch(() => null)
        const d = (detail && detail.data && detail.data.data) || match
        const growth = d.growth || {}
        const specs = d.specifications || {}
        const flower = d.flower || {}
        const foliage = d.foliage || {}
        const dist = d.distribution || {}
        const res = {
            name: d.common_name || match.common_name || "",
            scientificName: d.scientific_name || match.scientific_name || "",
            Family: d.family || "",
            Genero: d.genus || "",
            origin: (dist.native && dist.native[0]) || "",
            height: specs.height || "",
            flowercolor: (flower.color && flower.color[0]) ? mapFlowerColor(flower.color[0]) : "",
            flowering: trefleBloomToValue(growth.bloom_months),
            foliage: foliage.texture || "",
            light: trefleLightToValue(growth.light),
            soil: growth.soil_texture || "",
            type: trefleHabitToType(specs.growth_habit),
            tolerance: specs.soil_salinity != null ? String(specs.soil_salinity) : "",
            idealTemperature: (growth.minimum_temperature && growth.minimum_temperature.deg_c) ? `${growth.minimum_temperature.deg_c}°C` : ""
        }
        return res
    } catch (e) {
        return null
    }
}

// --- Wikipedia: descrição + origem (+ menções no texto) ---
async function queryWikipedia(q) {
    const api = axios.create({ timeout: 20000 })
    try {
        const res = await api.get("https://en.wikipedia.org/w/api.php", {
            params: {
                action: "query", titles: q,
                prop: "extracts", exintro: true, explaintext: true,
                format: "json", redirects: 1
            },
            headers: { "User-Agent": "Phytografia/1.0 (TCC project)" }
        })
        const pages = res.data.query && res.data.query.pages
        if (!pages) return null
        const page = Object.values(pages)[0]
        const text = page && page.extract ? page.extract : ""
        if (!text) return null
        const lower = text.toLowerCase()
        const resObj = {
            name: page.title || "",
            scientificName: page.title || "",
            simpleDescription: text.split(/\n/)[0] || text.substring(0, 200),
            description: text.substring(0, 1500)
        }
        // Origem
        const nativeMatch = text.match(/native to ([^.,;]+)/i)
        if (nativeMatch) resObj.origin = nativeMatch[1].trim()
        // Toxicidade
        if (/poison|toxic|toxin|cyanide/i.test(lower)) resObj.toxicity = "Baixa toxicidade"
        else resObj.toxicity = "Não é tóxica"
        // Cor de flor
        const flowerMatch = text.match(/flowers? are ([a-z\-]+)/i)
        if (flowerMatch) resObj.flowercolor = mapFlowerColor(flowerMatch[1])
        // Temperatura
        const tempMatch = text.match(/(\d+)\s*°C/i)
        if (tempMatch) resObj.idealTemperature = `${tempMatch[1]}°C`
        return resObj
    } catch (e) {
        return null
    }
}

// --- Perenual: tipo/família (grátis, dados básicos) ---
async function queryPerenual(q) {
    const key = process.env.PERENUAL_API_KEY
    if (!key) return null
    try {
        const api = axios.create({ timeout: 20000 })
        const res = await api.get("https://perenual.com/api/species-list", { params: { key, q } })
        const list = res.data && res.data.data
        const match = (list || []).find(r => normalizeStr((r.common_name || "")).includes(normalizeStr(q))) || (list || [])[0]
        if (!match) return null
        const detail = await api.get(`https://perenual.com/api/species/details/${match.id}`, { params: { key } }).catch(() => null)
        const d = (detail && detail.data) || match
        return {
            name: d.common_name || "",
            scientificName: Array.isArray(d.scientific_name) ? d.scientific_name[0] : (d.scientific_name || ""),
            Family: d.family || "",
            type: typeof d.type === "string" ? d.type : "",
            origin: d.origin && d.origin[0] ? d.origin[0] : ""
        }
    } catch (e) {
        return null
    }
}

plantRoutes.route("/plant/suggest").get(async function (req, res) {
    const q = (req.query.q || "").trim()
    if (!q) {
        return res.status(400).json({ message: "Informe um termo de busca (q)." })
    }

    const nq = normalizeStr(q)

    // 1) Resultados do banco local
    const localResults = localPlants
        .filter(p => {
            const n = normalizeStr(p.name)
            const s = normalizeStr(p.scientificName)
            return n.includes(nq) || s.includes(nq) || nq.includes(s)
        })
        .map(p => ({
            name: p.name,
            scientificName: p.scientificName,
            fields: { ...p },
            filledBy: Object.fromEntries(SUGGEST_FIELDS.map(f => p[f] ? [f, "local"] : null).filter(Boolean)),
            source: "local",
            score: calculateMatchScore(p, q),
            filledCount: countFilled(p)
        }))

    // 2) Buscas nas APIs (em paralelo)
    const [gbif, trefle, wiki, perenual] = await Promise.all([
        queryGbif(q).catch(() => null),
        queryTrefle(q).catch(() => null),
        queryWikipedia(q).catch(() => null),
        queryPerenual(q).catch(() => null)
    ])

    // Monta um candidato combinando todas as fontes (prioridade local > gbif > trefle > wiki > perenual)
    const apiResults = []
    const combined = {}
    const filledBy = {}
    const sources = { local: null, gbif, trefle, wiki, perenual }

    // Preenche campos: local primeiro, depois gbif/trefle/wiki/perenual
    const sourceMerge = (src, data) => {
        if (!data) return
        SUGGEST_FIELDS.forEach(f => {
            if (data[f] && String(data[f]).trim() !== "" && !combined[f]) {
                combined[f] = data[f]
                filledBy[f] = src
            }
        })
    }

    sourceMerge("local", localResults[0] ? localResults[0].fields : null)
    sourceMerge("gbif", gbif)
    sourceMerge("trefle", trefle)
    sourceMerge("wiki", wiki)
    sourceMerge("perenual", perenual)

    if (Object.keys(combined).length > 0) {
        apiResults.push({
            name: combined.name || combined.scientificName || q,
            scientificName: combined.scientificName || "",
            fields: combined,
            filledBy,
            source: Object.keys(filledBy).join("+") || "api",
            score: 50 + (combined.Filo ? 20 : 0) + (combined.Family ? 10 : 0),
            filledCount: countFilled(combined)
        })
    }

    // Une resultados locais e de API, sem duplicar
    const seen = new Set()
    const all = [...localResults, ...apiResults].filter(r => {
        const key = normalizeStr(r.name) + normalizeStr(r.scientificName)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    }).sort((a, b) => b.score - a.score || b.filledCount - a.filledCount).slice(0, 10)

    if (all.length === 0) {
        return res.status(404).json({ message: "Nenhuma planta encontrada para essa busca." })
    }

    res.status(200).json({ total: all.length, results: all })
})

/* ==================================================
   BUSCAR PLANTA POR ID
================================================== */
plantRoutes.route("/plant/:id").get(async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const id = req.params.id
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const result = await db_connect.collection("plants").findOne({ _id: new ObjectId(id) })
        if (!result) {
            return res.status(404).json({ message: `Planta com id ${id} não encontrada` })
        }
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   CRIAR PLANTA
================================================== */
plantRoutes.route("/plant/add").post(authenticateToken, authorizeRoles("ADM"), upload.fields([{ name: "images", maxCount: 5 }]), async function (req, res) {
    const db_connect = dbo.getDb()
    const files = req.files?.images || []
    const imagePaths = files.map(file => `/uploads/${file.filename}`)
    console.log(`[plant/add] recebido ${files.length} arquivo(s)`)
    const myobj = {
        name: req.body.name,
        scientificName: req.body.scientificName,
        description: req.body.description,
        simpleDescription: req.body.simpleDescription,
        fruit: req.body.fruit,
        origin: req.body.origin,
        type: req.body.type,
        propagation: req.body.propagation,
        toxicity: req.body.toxicity,
        dificulty: req.body.dificulty,
        Filo: req.body.Filo,
        Classe: req.body.Classe,
        Ordem: req.body.Ordem,
        Family: req.body.Family,
        Genero: req.body.Genero,
        Especie: req.body.Especie,
        height: req.body.height,
        flowercolor: req.body.flowercolor,
        foliage: req.body.foliage,
        flowering: req.body.flowering,
        light: req.body.light,
        water: req.body.water,
        size: req.body.size,
        soil: req.body.soil,
        watering: req.body.watering,
        fertilizing: req.body.fertilizing,
        pruning: req.body.pruning,
        pests: req.body.pests,
        manha: req.body.manha,
        amount: req.body.amount,
        frequency: req.body.frequency,
        NPK: req.body.NPK,
        season: req.body.season,
        tools: req.body.tools,
        prevention: req.body.prevention,
        monitoring: req.body.monitoring,
        planting: req.body.planting,
        exhibition: req.body.exhibition,
        maintenance: req.body.maintenance,
        station: req.body.station,
        spacing: req.body.spacing,
        iluminosity: req.body.iluminosity, // CORRIGIDO PARA ESTAR IGUAL AO FRONT-END
        protection: req.body.protection,
        idealTemperature: req.body.idealTemperature,
        tolerance: req.body.tolerance,
        
        imagesPath: imagePaths,
        imagePath: imagePaths[0] || ""
    }

    try {
        const result = await db_connect.collection("plants").insertOne(myobj)
        res.status(201).json({ result, imagesReceived: files.length, imagesPath: imagePaths })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   EDITAR PLANTA
================================================== */
plantRoutes.route("/plant/:id").put(authenticateToken, authorizeRoles("ADM"), upload.fields([{ name: "images", maxCount: 5 }]), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const id = req.params.id
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const myquery = { _id: new ObjectId(id) }
        
        const updateFields = {
            name: req.body.name,
            scientificName: req.body.scientificName,
            description: req.body.description,
            simpleDescription: req.body.simpleDescription,
            fruit: req.body.fruit,
            origin: req.body.origin,
            type: req.body.type,
            propagation: req.body.propagation,
            toxicity: req.body.toxicity,
            dificulty: req.body.dificulty,
            Filo: req.body.Filo,
            Classe: req.body.Classe,
            Ordem: req.body.Ordem,
            Family: req.body.Family,
            Genero: req.body.Genero,
            Especie: req.body.Especie,
            height: req.body.height,
            flowercolor: req.body.flowercolor,
            foliage: req.body.foliage,
            flowering: req.body.flowering,
            light: req.body.light,
            water: req.body.water,
            size: req.body.size,
            soil: req.body.soil,
            watering: req.body.watering,
            fertilizing: req.body.fertilizing,
            pruning: req.body.pruning,
            pests: req.body.pests,
            manha: req.body.manha,
            amount: req.body.amount,
            frequency: req.body.frequency,
            NPK: req.body.NPK,
            season: req.body.season,
            tools: req.body.tools,
            prevention: req.body.prevention,
            monitoring: req.body.monitoring,
            planting: req.body.planting,
            exhibition: req.body.exhibition,
            maintenance: req.body.maintenance,
            station: req.body.station,
            spacing: req.body.spacing,
            iluminosity: req.body.iluminosity, // CORRIGIDO PARA ESTAR IGUAL AO FRONT-END
            protection: req.body.protection,
            idealTemperature: req.body.idealTemperature,
            tolerance: req.body.tolerance
        }

        const files = req.files?.images || []
        if (files.length > 0) {
            const imagesPath = files.map(file => `/uploads/${file.filename}`)
            updateFields.imagesPath = imagesPath
            updateFields.imagePath = imagesPath[0] || ""
            console.log(`[plant/:id PUT] recebido ${files.length} arquivo(s)`)
        }

        const newvalues = { $set: updateFields }
        
        const result = await db_connect.collection("plants").updateOne(myquery, newvalues)
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: `Planta com id ${id} não encontrada` })
        }
        res.status(200).json({ message: "Planta updated com sucesso", imagesReceived: files.length })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   DELETAR PLANTA
================================================== */
plantRoutes.route("/plant/:id").delete(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const id = req.params.id
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const result = await db_connect.collection("plants").deleteOne({ _id: new ObjectId(id) })
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Planta não encontrada" })
        }
        res.status(200).json({ message: "Planta deletada com sucesso" })
    } catch (err) {
        res.status(500).json({ message: "Erro ao deletar planta" })
    }
})

/* ==================================================
   ROTAS DINÂMICAS PARA TRATAR TODAS AS SELEÇÕES
================================================== */

// LISTAR TODAS AS COLEÇÕES DE UMA VEZ (evita N+1 no frontend)
plantRoutes.route("/collections/all").get(async function (req, res) {
    const db_connect = dbo.getDb()
    const COLLECTIONS = [
        "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
        "height", "flowercolor", "foliage", "flowering", "light", "water",
        "size", "soil", "manha", "amount", "frequency", "NPK", "season",
        "tools", "prevention", "monitoring", "station", "spacing",
        "iluminosity", "protection", "idealTemperature", "tolerance",
        "Filo", "Classe", "Ordem", "Family", "Genero", "Especie"
    ]
    try {
        const results = await Promise.all(
            COLLECTIONS.map(name =>
                db_connect.collection(name).find({}).toArray().catch(() => [])
            )
        )
        const all = {}
        COLLECTIONS.forEach((name, i) => { all[name] = results[i] })
        res.status(200).json(all)
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar coleções: " + error.message })
    }
})

// LISTAR ELEMENTOS DE UMA COLEÇÃO DINAMICAMENTE
plantRoutes.route("/collections/:name").get(async function (req, res) {
    const db_connect = dbo.getDb()
    const colecaoAlvo = req.params.name
    try {
        const result = await db_connect.collection(colecaoAlvo).find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: `Erro ao buscar itens de ${colecaoAlvo}: ` + error.message })
    }
})

// ADICIONAR ELEMENTO EM UMA COLEÇÃO DINAMICAMENTE
plantRoutes.route("/collections/:name/add").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    const colecaoAlvo = req.params.name
    const novoItem = { name: req.body.name }
    try {
        const result = await db_connect.collection(colecaoAlvo).insertOne(novoItem)
        res.status(201).json({ _id: result.insertedId, name: req.body.name })
    } catch (error) {
        res.status(500).json({ message: `Erro ao salvar em ${colecaoAlvo}: ` + error.message })
    }
})

// DELETAR ELEMENTO DE UMA COLEÇÃO DINAMICAMENTE
plantRoutes.route("/collections/:name/:id").delete(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    const colecaoAlvo = req.params.name
    const id = req.params.id

    try {
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }

        const result = await db_connect.collection(colecaoAlvo).deleteOne({ _id: new ObjectId(id) })
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Item não encontrado." })
        }

        res.status(200).json({ message: "Item deletado com sucesso!" })
    } catch (error) {
        res.status(500).json({ message: `Erro ao deletar de ${colecaoAlvo}: ` + error.message })
    }
})

module.exports = plantRoutes