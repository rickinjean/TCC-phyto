const express = require("express")
const plantRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const XLSX = require("xlsx")
const ExcelJS = require("exceljs")

// Importar o multer e o path para gerir o upload de ficheiros
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const https = require("https")
const http = require("http")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Baixar imagem de URL e salvar em uploads/
function downloadImage(url, plantName) {
    return new Promise((resolve, reject) => {
        if (!url || !url.trim()) return resolve(null)
        const protocol = url.startsWith("https") ? https : http
        const ext = path.extname(new URL(url).pathname) || ".jpg"
        const safeName = plantName
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "_")
            .toLowerCase()
        const filename = `csv_${safeName}_${Date.now()}${ext}`
        const filepath = path.join(__dirname, "..", "uploads", filename)
        const file = fs.createWriteStream(filepath)
        protocol.get(url, { timeout: 10000 }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirect = response.headers.location
                const redirProtocol = redirect.startsWith("https") ? https : http
                redirProtocol.get(redirect, { timeout: 10000 }, (res2) => {
                    res2.pipe(file)
                    file.on("finish", () => { file.close(); resolve(`/uploads/${filename}`) })
                }).on("error", (err) => { fs.unlink(filepath, () => {}); reject(err) })
                return
            }
            if (response.statusCode !== 200) {
                file.close()
                fs.unlink(filepath, () => {})
                return reject(new Error(`HTTP ${response.statusCode}`))
            }
            response.pipe(file)
            file.on("finish", () => { file.close(); resolve(`/uploads/${filename}`) })
        }).on("error", (err) => { fs.unlink(filepath, () => {}); reject(err) })
    })
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
   CLONAR PLANTA (retorna cópia dos dados sem _id e images)
================================================== */
plantRoutes.route("/plant/:id/clone").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
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
        // Remove _id, imagesPath e imagePath para criar uma cópia limpa
        const { _id, imagesPath, imagePath, ...cloneData } = result
        res.status(200).json(cloneData)
    } catch (error) {
        res.status(500).json({ message: error.message })
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

/* ==================================================
   ROTAS DE TEMPLATES
================================================== */

// LISTAR TODOS OS TEMPLATES
plantRoutes.route("/templates").get(async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const result = await db_connect.collection("templates").find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar templates: " + error.message })
    }
})

// CRIAR TEMPLATE (ADM)
plantRoutes.route("/templates/add").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const { name, fields } = req.body
        if (!name || !fields) {
            return res.status(400).json({ message: "Nome e campos são obrigatórios." })
        }
        const tmpl = { name, fields, createdAt: new Date() }
        const result = await db_connect.collection("templates").insertOne(tmpl)
        res.status(201).json({ _id: result.insertedId, name, fields })
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar template: " + error.message })
    }
})

// EDITAR TEMPLATE (ADM)
plantRoutes.route("/templates/:id").put(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const id = req.params.id
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const { name, fields } = req.body
        const update = {}
        if (name) update.name = name
        if (fields) update.fields = fields
        const result = await db_connect.collection("templates").updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        )
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Template não encontrado." })
        }
        res.status(200).json({ message: "Template atualizado com sucesso." })
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar template: " + error.message })
    }
})

// DELETAR TEMPLATE (ADM)
plantRoutes.route("/templates/:id").delete(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const id = req.params.id
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID inválido" })
        }
        const result = await db_connect.collection("templates").deleteOne({ _id: new ObjectId(id) })
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Template não encontrado." })
        }
        res.status(200).json({ message: "Template deletado com sucesso!" })
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar template: " + error.message })
    }
})

/* ==================================================
   IMPORTAÇÃO CSV
================================================== */

const { parse } = require("csv-parse/sync")

const CSV_FIELDS = [
    // === IDENTIFICAÇÃO ===
    "name", "scientificName", "simpleDescription", "description",
    // === CLASSIFICAÇÃO BOTÂNICA ===
    "Filo", "Classe", "Ordem", "Family", "Genero", "Especie",
    // === CARACTERÍSTICAS ===
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
    "height", "flowercolor", "foliage", "flowering",
    // === CUIDADOS BÁSICOS ===
    "light", "water", "size", "soil",
    // === MANUTENÇÃO ===
    "watering", "fertilizing", "pruning", "pests",
    "manha", "amount", "frequency", "NPK", "season", "tools", "prevention", "monitoring",
    // === PLANTIO & CULTIVO ===
    "planting", "exhibition", "maintenance",
    "station", "spacing", "iluminosity", "protection", "idealTemperature", "tolerance",
    // === IMAGENS ===
    "imageUrl1", "imageUrl2", "imageUrl3", "imageUrl4", "imageUrl5"
]

const CSV_LABELS = {
    // Identificação
    name: "Nome Popular", scientificName: "Nome Científico",
    simpleDescription: "Descrição Curta", description: "Descrição",
    // Classificação Botânica
    Filo: "Filo", Classe: "Classe", Ordem: "Ordem", Family: "Família",
    Genero: "Gênero", Especie: "Espécie",
    // Características
    fruit: "Fruto", origin: "Origem", type: "Tipo", propagation: "Propagação",
    toxicity: "Toxicidade", dificulty: "Dificuldade",
    height: "Altura", flowercolor: "Cor da Flor", foliage: "Folhagem", flowering: "Floração",
    // Cuidados Básicos
    light: "Luz", water: "Água", size: "Tamanho", soil: "Solo",
    // Manutenção
    watering: "Irrigação", fertilizing: "Adubação", pruning: "Poda", pests: "Pragas",
    manha: "Horário Rega", amount: "Quantidade Água", frequency: "Freq. Adubação",
    NPK: "NPK", season: "Época Poda", tools: "Ferramenta Poda",
    prevention: "Prevenção Pragas", monitoring: "Monitoramento",
    // Plantio & Cultivo
    planting: "Plantio", exhibition: "Exposição", maintenance: "Manutenção",
    station: "Estação Plantio", spacing: "Espaçamento", iluminosity: "Luminosidade",
    protection: "Proteção", idealTemperature: "Temperatura Ideal", tolerance: "Tolerância",
    // Imagens
    imageUrl1: "URL Imagem 1", imageUrl2: "URL Imagem 2",
    imageUrl3: "URL Imagem 3", imageUrl4: "URL Imagem 4", imageUrl5: "URL Imagem 5"
}

// Resolver texto -> ObjectId para campos de coleção
async function resolveTextToId(db, collectionName, textValue) {
    if (!textValue || !textValue.trim()) return ""
    const normalized = textValue.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const options = await db.collection(collectionName).find({}).toArray()
    const exact = options.find(o => o.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized)
    if (exact) return exact._id.toString()
    const partial = options.find(o =>
        normalized.includes(o.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
        o.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalized)
    )
    if (partial) return partial._id.toString()
    // Criar novo item na coleção
    const result = await db.collection(collectionName).insertOne({ name: textValue.trim() })
    return result.insertedId.toString()
}

const COLLECTION_FIELDS = [
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
    "height", "flowercolor", "foliage", "flowering",
    "light", "water", "size", "soil",
    "manha", "amount", "frequency", "NPK", "season", "tools",
    "prevention", "monitoring", "station", "spacing",
    "iluminosity", "protection", "idealTemperature", "tolerance"
]

// Definição dos campos verticais para o template
const VERTICAL_FIELDS = [
    // IDENTIFICAÇÃO (verde)
    { key: "name", label: "Nome Popular", section: "IDENTIFICAÇÃO", color: "92D050", required: true },
    { key: "scientificName", label: "Nome Científico", section: "IDENTIFICAÇÃO", color: "92D050", required: true },
    { key: "simpleDescription", label: "Descrição Curta", section: "IDENTIFICAÇÃO", color: "92D050" },
    { key: "description", label: "Descrição", section: "IDENTIFICAÇÃO", color: "92D050" },
    // CLASSIFICAÇÃO BOTÂNICA (azul)
    { key: "Filo", label: "Filo", section: "CLASSIFICAÇÃO BOTÂNICA", color: "5B9BD5" },
    { key: "Classe", label: "Classe", section: "CLASSIFICAÇÃO BOTÂNICA", color: "5B9BD5" },
    { key: "Ordem", label: "Ordem", section: "CLASSIFICAÇÃO BOTÂNICA", color: "5B9BD5" },
    { key: "Family", label: "Família", section: "CLASSIFICAÇÃO BOTÂNICA", color: "5B9BD5" },
    { key: "Genero", label: "Gênero", section: "CLASSIFICAÇÃO BOTÂNICA", color: "5B9BD5" },
    { key: "Especie", label: "Espécie", section: "CLASSIFICAÇÃO BOTÂNICA", color: "5B9BD5" },
    // CARACTERÍSTICAS (laranja)
    { key: "fruit", label: "Fruto", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "origin", label: "Origem", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "type", label: "Tipo", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "propagation", label: "Propagação", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "toxicity", label: "Toxicidade", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "dificulty", label: "Dificuldade", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "height", label: "Altura", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "flowercolor", label: "Cor da Flor", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "foliage", label: "Folhagem", section: "CARACTERÍSTICAS", color: "ED7D31" },
    { key: "flowering", label: "Floração", section: "CARACTERÍSTICAS", color: "ED7D31" },
    // CUIDADOS BÁSICOS (amarelo)
    { key: "light", label: "Luz", section: "CUIDADOS BÁSICOS", color: "FFC000" },
    { key: "water", label: "Água", section: "CUIDADOS BÁSICOS", color: "FFC000" },
    { key: "size", label: "Tamanho", section: "CUIDADOS BÁSICOS", color: "FFC000" },
    { key: "soil", label: "Solo", section: "CUIDADOS BÁSICOS", color: "FFC000" },
    // MANUTENÇÃO (roxo)
    { key: "watering", label: "Irrigação", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "fertilizing", label: "Adubação", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "pruning", label: "Poda", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "pests", label: "Pragas", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "manha", label: "Horário Rega", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "amount", label: "Quantidade Água", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "frequency", label: "Freq. Adubação", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "NPK", label: "NPK", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "season", label: "Época Poda", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "tools", label: "Ferramenta Poda", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "prevention", label: "Prevenção Pragas", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    { key: "monitoring", label: "Monitoramento", section: "MANUTENÇÃO", color: "7030A0", fontColor: "FFFFFF" },
    // PLANTIO & CULTIVO (vermelho)
    { key: "planting", label: "Plantio", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "exhibition", label: "Exposição", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "maintenance", label: "Manutenção", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "station", label: "Estação Plantio", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "spacing", label: "Espaçamento", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "iluminosity", label: "Luminosidade", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "protection", label: "Proteção", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "idealTemperature", label: "Temperatura Ideal", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    { key: "tolerance", label: "Tolerância", section: "PLANTIO & CULTIVO", color: "FF0000", fontColor: "FFFFFF" },
    // IMAGENS (cinza)
    { key: "imageUrl1", label: "URL Imagem 1", section: "IMAGENS", color: "A5A5A5" },
    { key: "imageUrl2", label: "URL Imagem 2", section: "IMAGENS", color: "A5A5A5" },
    { key: "imageUrl3", label: "URL Imagem 3", section: "IMAGENS", color: "A5A5A5" },
    { key: "imageUrl4", label: "URL Imagem 4", section: "IMAGENS", color: "A5A5A5" },
    { key: "imageUrl5", label: "URL Imagem 5", section: "IMAGENS", color: "A5A5A5" },
]

// Baixar template XLSX (arquivo estático criado manualmente)
plantRoutes.route("/plant/import/template").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    try {
        const templatePath = path.join(__dirname, "..", "data", "template_plantas.xlsx")
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ message: "Template não encontrado. Crie o arquivo em server/data/template_plantas.xlsx" })
        }
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.setHeader("Content-Disposition", 'attachment; filename="template_plantas.xlsx"')
        res.sendFile(templatePath)
    } catch (error) {
        console.error("Erro ao enviar template:", error)
        res.status(500).json({ message: "Erro ao enviar template: " + error.message })
    }
})

// Mapeamento de label vertical -> campo interno
const VERTICAL_LABEL_TO_FIELD = {}
VERTICAL_FIELDS.forEach(f => { VERTICAL_LABEL_TO_FIELD[f.label] = f.key })
// Aceitar labels com asterisco (obrigatório)
VERTICAL_FIELDS.forEach(f => { VERTICAL_LABEL_TO_FIELD[f.label + " *"] = f.key })

// Parse XLSX vertical -> array de plantas
function parseVerticalXlsx(buffer) {
    const wb = new ExcelJS.Workbook()
    return wb.xlsx.load(buffer).then(() => {
        const ws = wb.getWorksheet("Dados")
        if (!ws) throw new Error("Aba 'Dados' não encontrada no arquivo.")

        const plants = []
        let currentPlant = null

        ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // pular cabeçalho

            const colA = (row.getCell(1).value || "").toString().trim()
            const colB = (row.getCell(2).value || "").toString().trim()

            // Detectar separador de planta
            if (colA.startsWith("── PLANTA")) {
                if (currentPlant && currentPlant.name) plants.push(currentPlant)
                currentPlant = {}
                return
            }

            if (!currentPlant) currentPlant = {}

            // Mapear label -> campo
            const fieldKey = VERTICAL_LABEL_TO_FIELD[colA]
            if (fieldKey && colB) {
                currentPlant[fieldKey] = colB
            }
        })

        // Última planta
        if (currentPlant && currentPlant.name) plants.push(currentPlant)
        return plants
    })
}

// Importar CSV ou XLSX
plantRoutes.route("/plant/import").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const { csvContent, fileBase64, fileName } = req.body

        let plants = []

        // Determinar formato
        const isXlsx = fileName && (fileName.endsWith(".xlsx") || fileName.endsWith(".xls"))

        if (isXlsx && fileBase64) {
            // XLSX vertical
            try {
                const buffer = Buffer.from(fileBase64, "base64")
                plants = await parseVerticalXlsx(buffer)
            } catch (e) {
                return res.status(400).json({ message: "Erro ao ler planilha: " + e.message })
            }
        } else if (csvContent) {
            // CSV horizontal
            let records
            try {
                records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true, bom: true })
            } catch (e) {
                return res.status(400).json({ message: "Erro ao ler CSV: " + e.message })
            }
            if (records.length === 0) {
                return res.status(400).json({ message: "O arquivo está vazio." })
            }
            const labelToField = {}
            CSV_FIELDS.forEach(f => { labelToField[CSV_LABELS[f]] = f })
            for (const row of records) {
                const plant = {}
                for (const [label, value] of Object.entries(row)) {
                    const field = labelToField[label] || label
                    if (CSV_FIELDS.includes(field) && value && value.trim()) {
                        plant[field] = value.trim()
                    }
                }
                if (plant.name) plants.push(plant)
            }
        } else {
            return res.status(400).json({ message: "Nenhum conteúdo fornecido." })
        }

        if (plants.length === 0) {
            return res.status(400).json({ message: "Nenhuma planta encontrada no arquivo." })
        }

        const results = { total: plants.length, success: 0, errors: [], plants: [] }

        for (let i = 0; i < plants.length; i++) {
            const plant = plants[i]
            const rowNum = i + 1

            if (!plant.name) {
                results.errors.push({ row: rowNum, message: "Nome popular é obrigatório." })
                continue
            }

            // Resolver campos de coleção -> ObjectIds
            for (const field of COLLECTION_FIELDS) {
                if (plant[field]) {
                    plant[field] = await resolveTextToId(db_connect, field, plant[field])
                }
            }

            // Extrair URLs de imagem
            const imageUrls = [plant.imageUrl1, plant.imageUrl2, plant.imageUrl3, plant.imageUrl4, plant.imageUrl5].filter(Boolean)
            delete plant.imageUrl1
            delete plant.imageUrl2
            delete plant.imageUrl3
            delete plant.imageUrl4
            delete plant.imageUrl5

            try {
                const insertResult = await db_connect.collection("plants").insertOne(plant)
                const newPlantId = insertResult.insertedId

                // Baixar e associar imagens
                const imagePaths = []
                for (const url of imageUrls) {
                    try {
                        const imgPath = await downloadImage(url, plant.name)
                        if (imgPath) imagePaths.push(imgPath)
                    } catch (imgErr) {
                        console.log(`Erro ao baixar imagem: ${url} - ${imgErr.message}`)
                    }
                }
                if (imagePaths.length > 0) {
                    await db_connect.collection("plants").updateOne(
                        { _id: newPlantId },
                        { $set: { imagesPath: imagePaths, imagePath: imagePaths[0] || "" } }
                    )
                }

                results.success++
                results.plants.push({ _id: newPlantId, name: plant.name })
            } catch (e) {
                results.errors.push({ row: rowNum, message: e.message })
            }
        }

        res.status(200).json(results)
    } catch (error) {
        res.status(500).json({ message: "Erro ao importar: " + error.message })
    }
})

module.exports = plantRoutes