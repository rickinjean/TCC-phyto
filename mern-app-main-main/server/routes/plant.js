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
   Combina: Gemini (IA) + GBIF + Trefle + Perenual
   Preenche o máximo de campos possível a partir do nome
================================================== */

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
// Retorna apenas taxonomia de PLANTA (reino Plantae). Aceita o nome científico
// (preferido, mais preciso) ou o nome comum como fallback.
function isPlantKingdom(k) {
    return normalizeStr(k) === "plantae"
}
function isPlantPhylum(p) {
    // Filos exclusivos de plantas (evita vírus/bactérias/fungos)
    const plantPhylums = ["magnoliophyta", "tracheophyta", "charophyta", "streptophyta", "pteridophyta", "bryophyta", "anthocerotophyta", "marchantiophyta", "gnetophyta", "pinophyta", "cycadophyta", "ginkgophyta"]
    return plantPhylums.includes(normalizeStr(p))
}
function gbifToTax(data) {
    if (!data) return null
    // Só aceita se for uma planta (kingdom=Plantae ou filo de planta)
    const kingdom = data.kingdom || ""
    const phylum = data.phylum || ""
    if (!isPlantKingdom(kingdom) && !isPlantPhylum(phylum)) return null
    return {
        Filo: data.phylum || "",
        Classe: data.class || "",
        Ordem: data.order || "",
        Family: data.family || "",
        Genero: data.genus || "",
        Especie: data.species || data.canonicalName || "",
        scientificName: data.scientificName || data.canonicalName || ""
    }
}
async function queryGbif(q, scientificName) {
    const gbif = axios.create({ timeout: 20000 })
    let tax = null

    // 1) Prefere validar pelo nome científico (retornado pelo Gemini) — muito mais preciso
    if (scientificName && normalizeStr(scientificName).length >= 4) {
        const sci = scientificName.split(",")[0].trim()
        const matchRes = await gbif.get("https://api.gbif.org/v1/species/match", { params: { name: sci } }).catch(() => null)
        const m = matchRes?.data
        if (m && m.rank && ["SPECIES", "SUBSPECIES", "VARIETY", "GENUS"].includes(m.rank)) {
            tax = gbifToTax(m)
        }
    }

    // 2) Fallback: busca por nome comum filtrando para plantas
    if (!tax) {
        const searchRes = await gbif.get("https://api.gbif.org/v1/species/search", { params: { q, limit: 10 } }).catch(() => null)
        const list = searchRes?.data?.results || []
        for (const s of list) {
            const candidate = gbifToTax(s)
            if (candidate) { tax = candidate; break }
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

// --- Gemini: geração completa de dados da planta (IA) ---
async function queryGemini(q) {
    const key = process.env.GEMINI_API_KEY
    if (!key) return null

    const prompt = `Você é um botânico brasileiro especializado em plantas. 
Preencha as informações da planta "${q}". 
Responda APENAS com um JSON válido (sem texto antes ou depois), usando as chaves EXATAS listadas abaixo.

Para os campos que possuem OPÇÕES, use obrigatoriamente um dos valores sugeridos (na língua portuguesa). 
Campos numéricos/textuais podem ter texto livre e conciso em português.

Campos e opções:
{
  "name": "nome popular da planta",
  "scientificName": "nome científico binomial",
  "simpleDescription": "frase curta de até 200 caracteres descrevendo a planta",
  "description": "descrição detalhada em português (2-4 frases)",
  "fruit": "opções: Bagas; Drupa; Cápsula; Pomo; Legume (vagem); Noz; Infrutescência; Falso fruto; Sachara; "Precisamos rever"; ou descreva o fruto",
  "origin": "opções: América do Sul; América Central; África; Ásia; Europa; Oceania; Mediterrâneo; Brasil; Tropical; Subtropical; Temperado; ou local de origem geográfica",
  "type": "opções: Árvore; Arbusto; Erva; Trepadeira; Suculenta; Palmeira; Samambaia; Gramínea; Aquática; Ornamental; Frutífera",
  "propagation": "opções: Sementes; Vegetativa (assexuada); Estacas; Mergulhia; Alporquia; Borbulhia; Divisão de touceiras; ou como se propaga",
  "toxicity": "opções: Não é tóxica; Baixa toxicidade; Moderada; Alta toxicidade",
  "dificulty": "opções: Baixa; Média; Alta",
  "Filo": "filo (ex: Magnoliophyta)",
  "Classe": "classe (ex: Magnoliopsida)",
  "Ordem": "ordem (ex: Rosales)",
  "Family": "família (ex: Rosaceae)",
  "Genero": "gênero (ex: Rosa)",
  "Especie": "espécie (ex: Rosa gallica)",
  "height": "opções: Rasteira; Até 1 m; 1-3 metros; 3-6 metros; 6-10 metros; Acima de 10 metros; ou porte/altura",
  "flowercolor": "opções: Vermelho; Rosa ou roxo; Branco puro; Amarelo; Azul; Laranja; Verde; Multicoloridas; ou as cores das flores",
  "foliage": "opções: Decídua; Perene; Sempre-verde; Caduca; ou tipo de folhagem",
  "flowering": "opções: Primavera; Verão; Outono; Primavera/Verão; Verão/Outono; Outono/Inverno; Inverno; Primavera/Verão/Outono; ou época de floração",
  "light": "opções: Sol pleno; Meia-sombra; Sombra; Penumbra",
  "water": "opções: Pouca; Moderada; Abundante",
  "size": "opções: Pequeno; Médio; Grande; Pote até 1L; Vaso 2-5L; Vaso 5-10L; Vaso acima de 10L; ou tamanho de vaso/local",
  "soil": "opções: Arenoso; Argiloso; Orgânico; Bem drenado; Ácido; Neutro; Alcalino; Rico em matéria orgânica; ou tipo de solo",
  "manha": "opções: Início da manhã; Final da tarde; Qualquer horário; ou melhor horário de rega",
  "amount": "opções: Pouca água; Moderada; Muita água; ou quantidade (ex: 100-200 ml)",
  "frequency": "opções: Diária; A cada 2-3 dias; Semanal; A cada 2 semanas; Mensal; ou frequência de adubação",
  "NPK": "opções: 04-14-08; 10-10-10; 20-05-20; 15-15-20; 30-10-10; 4-30-10; ou fórmula NPK recomendada",
  "season": "opções: Primavera; Verão; Outono; Inverno; Muito anos; ou época de poda",
  "tools": "opções: Tesoura de poda; Faca; Serra; Torno; Tesoura de jardinagem; ou ferramenta de poda",
  "prevention": "opções: Baixa; Média; Alta; ou nível de prevenção de pragas",
  "monitoring": "opções: Baixo; Médio; Alto; ou nível de monitoramento",
  "planting": "texto conciso sobre como plantar",
  "exhibition": "texto conciso sobre exposição/local",
  "maintenance": "texto conciso sobre manutenção",
  "station": "opções: Primavera; Verão; Outono; Inverno; ou estação de plantio",
  "spacing": "opções: 0,2 m; 0,3 m; 0,5 m; 1 m; 2 m; 3 m; 5 m; ou espaçamento entre mudas",
  "iluminosity": "opções: 4-6 horas; 6-8 horas; 8-12 horas; Direta; Indireta; ou horas de sol diário",
  "protection": "opções: Nenhuma; Vento; Geada; Pragas; Excesso de sol; Chuvas fortes; Proteção invernal; ou proteção climática",
  "idealTemperature": "ex: 20°C a 30°C",
  "tolerance": "opções: Baixa; Média; Alta; ou tolerância a condições adversas",
  "pests": "opções: Pulgões; Cochonilhas; Ácaros; Lagartas; Formigas; Fungos; Nematoides; Moscas-brancas; Sem pragas comuns; ou pragas principais",
  "watering": "texto conciso sobre irrigação",
  "fertilizing": "texto conciso sobre adubação",
  "pruning": "texto conciso sobre poda"
}

Prefira valores das OPÇÕES quando disponíveis. Se não tiver certeza, preencha com valor razoável típico, ainda assim em português. Não deixe campos vazios desnecessariamente.`

    try {
        const api = axios.create({ timeout: 45000 })
        const res = await api.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    responseMimeType: "application/json"
                }
            },
            { headers: { "x-goog-api-key": key, "Content-Type": "application/json" } }
        )

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) return null

        let parsed
        try {
            // Remove eventuais delimitadores de bloco de código
            const cleaned = text.replace(/```json|```/g, "").trim()
            const start = cleaned.indexOf("{")
            const end = cleaned.lastIndexOf("}")
            if (start === -1 || end === -1) return null
            parsed = JSON.parse(cleaned.substring(start, end + 1))
        } catch {
            return null
        }

        // Normaliza alguns campos conhecidos para os valores padrão do sistema
        if (typeof parsed.toxicity === "string") {
            const t = normalizeStr(parsed.toxicity)
            if (t.includes("nao") || t.includes("nenhuma") || t.includes("sem")) parsed.toxicity = "Não é tóxica"
            else if (t.includes("baix")) parsed.toxicity = "Baixa toxicidade"
            else if (t.includes("alt")) parsed.toxicity = "Alta toxicidade"
            else if (t.includes("moder")) parsed.toxicity = "Moderada"
        }
        if (typeof parsed.light === "string") {
            const l = normalizeStr(parsed.light)
            if (l.includes("sol") || l.includes("pleno")) parsed.light = "Sol pleno"
            else if (l.includes("sombra") && (l.includes("meia") || l.includes("parcial"))) parsed.light = "Meia-sombra"
            else if (l.includes("sombra")) parsed.light = "Sombra"
            else if (l.includes("penumbra") || l.includes("penumb")) parsed.light = "Penumbra"
        }
        if (typeof parsed.water === "string") {
            const w = normalizeStr(parsed.water)
            if (w.includes("pouc")) parsed.water = "Pouca"
            else if (w.includes("muit") || w.includes("abund") || w.includes("alta")) parsed.water = "Abundante"
            else parsed.water = "Moderada"
        }

        const fields = {}
        SUGGEST_FIELDS.forEach(f => {
            if (parsed[f] !== undefined && parsed[f] !== null && String(parsed[f]).trim() !== "") {
                fields[f] = String(parsed[f]).trim()
            }
        })
        if (Object.keys(fields).length === 0) return null
        return fields
    } catch (e) {
        console.error("[gemini] erro:", e.message)
        return null
    }
}

plantRoutes.route("/plant/suggest").get(async function (req, res) {
    const q = (req.query.q || "").trim()
    if (!q) {
        return res.status(400).json({ message: "Informe um termo de busca (q)." })
    }

    const nq = normalizeStr(q)

    // Gemini é a fonte principal: consulta primeiro para obter o nome científico
    const gemini = await queryGemini(q).catch(() => null)

    // Demais fontes em paralelo (GBIF valida a taxonomia usando o nome científico do Gemini)
    const [gbif, trefle, perenual] = await Promise.all([
        queryGbif(q, gemini ? gemini.scientificName : "").catch(() => null),
        queryTrefle(q).catch(() => null),
        queryPerenual(q).catch(() => null)
    ])

    // Combina os campos com a seguinte prioridade:
    //   1. Gemini (fonte principal, preenche quase tudo)
    //   2. GBIF (sobrescreve a taxonomia com classificação validada)
    //   3. trefle / perenual (preenchem lacunas)
    const combined = (gemini ? { ...gemini } : {})
    const filledBy = {}
    Object.keys(combined).forEach(f => { filledBy[f] = "gemini" })

    // GBIF: sobrescreve apenas os campos taxonômicos (Filo, Classe, Ordem, Family, Genero, Especie)
    const taxFields = ["Filo", "Classe", "Ordem", "Family", "Genero", "Especie"]
    if (gbif) {
        taxFields.forEach(f => {
            if (gbif[f] && String(gbif[f]).trim() !== "") {
                combined[f] = gbif[f]
                filledBy[f] = "gbif"
            }
        })
        if (gbif.scientificName && !combined.scientificName) {
            combined.scientificName = gbif.scientificName
            filledBy.scientificName = "gbif"
        }
    }

    // Fontes complementares preenchem apenas o que ainda está vazio
    const sourceMerge = (src, data) => {
        if (!data) return
        SUGGEST_FIELDS.forEach(f => {
            if (data[f] && String(data[f]).trim() !== "" && !combined[f]) {
                combined[f] = data[f]
                filledBy[f] = src
            }
        })
    }
    sourceMerge("trefle", trefle)
    sourceMerge("perenual", perenual)

    if (Object.keys(combined).length === 0) {
        return res.status(404).json({ message: "Nenhuma planta encontrada para essa busca." })
    }

    const name = combined.name || combined.scientificName || q
    const scientificName = combined.scientificName || ""

    const score = (combined.Filo ? 20 : 0) + (combined.Family ? 10 : 0) + (combined.name ? 20 : 0) + (Object.keys(combined).length * 1.5)
    res.status(200).json({
        total: 1,
        results: [{
            name,
            scientificName,
            fields: combined,
            filledBy,
            source: Object.keys(filledBy).join("+") || "api",
            score,
            filledCount: countFilled(combined)
        }]
    })
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