const express = require("express")
const plantRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId

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
    "name", "scientificName", "simpleDescription", "description",
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
    "Filo", "Classe", "Ordem", "Family", "Genero", "Especie",
    "height", "flowercolor", "foliage", "flowering",
    "light", "water", "size", "soil",
    "watering", "fertilizing", "pruning", "pests",
    "manha", "amount", "frequency", "NPK", "season", "tools", "prevention", "monitoring",
    "planting", "exhibition", "maintenance",
    "station", "spacing", "iluminosity", "protection", "idealTemperature", "tolerance"
]

const CSV_LABELS = {
    name: "Nome Popular", scientificName: "Nome Científico",
    simpleDescription: "Descrição Curta", description: "Descrição",
    fruit: "Fruto", origin: "Origem", type: "Tipo", propagation: "Propagação",
    toxicity: "Toxicidade", dificulty: "Dificuldade",
    Filo: "Filo", Classe: "Classe", Ordem: "Ordem", Family: "Família",
    Genero: "Gênero", Especie: "Espécie",
    height: "Altura", flowercolor: "Cor da Flor", foliage: "Folhagem", flowering: "Floração",
    light: "Luz", water: "Água", size: "Tamanho", soil: "Solo",
    watering: "Irrigação", fertilizing: "Adubação", pruning: "Poda", pests: "Pragas",
    manha: "Horário Rega", amount: "Quantidade Água", frequency: "Freq. Adubação",
    NPK: "NPK", season: "Época Poda", tools: "Ferramenta Poda",
    prevention: "Prevenção Pragas", monitoring: "Monitoramento",
    planting: "Plantio", exhibition: "Exposição", maintenance: "Manutenção",
    station: "Estação Plantio", spacing: "Espaçamento", iluminosity: "Luminosidade",
    protection: "Proteção", idealTemperature: "Temperatura Ideal", tolerance: "Tolerância"
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

// Baixar template CSV vazio
plantRoutes.route("/plant/import/template").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const header = CSV_FIELDS.map(f => CSV_LABELS[f] || f).join(",")
    const example = [
        "Morango,Fragaria × ananassa,Planta rasteira frutífera,Planta popular para frutos e jardins",
        "Bagas,América do Sul,Frutífera,Sementes,Não é tóxica,Média,Magnoliophyta,Magnoliopsida,Rosales,Rosaceae,Fragaria,Fragaria × ananassa",
        "Até 1 m,Rosa,Perene,Primavera/Verão,Sol pleno,Abundante,Médio,Bem drenado",
        "Rega frequente,Adubação a cada 15 dias,Poda leve,Pragas ocasionais",
        "Início da manhã,Moderada,Semanal,10-10-10,Primavera,Tesoura de poda,Baixa,Baixo",
        "Plantar em local ensolarado,Exposição externa,Manutenção moderada",
        "Primavera,0.3 m,6-8 horas,Nenhuma,20°C a 28°C,Alta"
    ].join(",")
    const csvContent = header + "\n" + example + "\n"
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", 'attachment; filename="template_plantas.csv"')
    res.send("\uFEFF" + csvContent)
})

// Importar CSV
plantRoutes.route("/plant/import").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const { csvContent } = req.body
        if (!csvContent) {
            return res.status(400).json({ message: "Nenhum conteúdo CSV fornecido." })
        }

        let records
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true
            })
        } catch (e) {
            return res.status(400).json({ message: "Erro ao ler CSV: " + e.message })
        }

        if (records.length === 0) {
            return res.status(400).json({ message: "O CSV está vazio." })
        }

        // Mapear labels do CSV -> campos internos
        const labelToField = {}
        CSV_FIELDS.forEach(f => { labelToField[CSV_LABELS[f]] = f })

        const results = { total: records.length, success: 0, errors: [], plants: [] }

        for (let i = 0; i < records.length; i++) {
            const row = records[i]
            const rowNum = i + 2

            // Mapear labels -> campos
            const plant = {}
            for (const [label, value] of Object.entries(row)) {
                const field = labelToField[label] || label
                if (CSV_FIELDS.includes(field) && value && value.trim()) {
                    plant[field] = value.trim()
                }
            }

            // Validação: name obrigatório
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

            try {
                const insertResult = await db_connect.collection("plants").insertOne(plant)
                results.success++
                results.plants.push({ _id: insertResult.insertedId, name: plant.name })
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