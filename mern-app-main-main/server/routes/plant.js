const express = require("express")
const plantRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId

// Importar o multer para gerir o upload de ficheiros
const multer = require("multer")
const sharp = require("sharp")
const { getBucket } = require("../gridfs")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Variantes com/sem acento para busca tolerante a diacríticos
const DIACRITIC_VARIANTS = {
    a: "aàáâãä", e: "eèéêë", i: "iìíîï", o: "oòóôõö",
    u: "uùúûü", c: "cç", n: "nñ", y: "yýÿ"
}

// Regex de busca que aceita qualquer combinação de caixa e acentos,
// ex.: "mamao", "Mamão" e "MAmÃO" encontram a mesma planta.
function searchRegex(term) {
    const pattern = escapeRegex(term).split("").map(ch => {
        const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const variants = DIACRITIC_VARIANTS[base]
        return variants ? `[${variants}]` : ch
    }).join("")
    return new RegExp(pattern, "i")
}

// Coleções de dicionário permitidas — usada como whitelist para as rotas
// dinâmicas /collections e para o cache de /collections/all
const COLLECTIONS = [
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
    "height", "flowercolor", "foliage", "flowering", "light", "water",
    "size", "soil", "manha", "amount", "frequency", "NPK", "season",
    "tools", "prevention", "monitoring", "station", "spacing",
    "iluminosity", "protection", "idealTemperature", "tolerance",
    "Filo", "Classe", "Ordem", "Family", "Genero", "Especie"
]

const COLLECTIONS_SET = new Set(COLLECTIONS)

// Cache simples em memória para /collections/all (TTL 60s).
// Invalidado a cada inserção/remoção de item de dicionário.
let collectionsCache = { data: null, fetchedAt: 0 }
const COLLECTIONS_TTL_MS = 60 * 1000

function clearCollectionsCache() {
    collectionsCache = { data: null, fetchedAt: 0 }
}

async function loadAllCollections() {
    const db_connect = dbo.getDb()
    const now = Date.now()
    if (collectionsCache.data && now - collectionsCache.fetchedAt < COLLECTIONS_TTL_MS) {
        return collectionsCache.data
    }
    const results = await Promise.all(
        COLLECTIONS.map(name =>
            db_connect.collection(name).find({}).toArray().catch(() => [])
        )
    )
    const all = {}
    COLLECTIONS.forEach((name, i) => { all[name] = results[i] })
    collectionsCache = { data: all, fetchedAt: now }
    return all
}

// Salvar diretamente em memória e gravar no GridFS (MongoDB), não no disco
const upload = multer({
    storage: multer.memoryStorage(),
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

async function salvarImagensGridFS(files) {
    const bucket = getBucket()

    // Salva um buffer no GridFS e retorna o id
    function uploadBuffer(buffer, contentType, originalname) {
        return new Promise((resolve, reject) => {
            const stream = bucket.openUploadStream(originalname, {
                contentType,
                metadata: { originalname }
            })
            stream.on("error", reject)
            stream.on("finish", () => resolve(stream.id))
            stream.end(buffer)
        })
    }

    const SIZES = [400, 800, 1200, 1600]

    const images = []
    for (const file of files) {
        // Redimensiona e otimiza para a web (exceto GIF/animações), mantendo a proporção
        let animated = false
        try {
            const meta = await sharp(file.buffer).metadata()
            animated = (meta.pages || 1) > 1
        } catch {
            // não é um formato de imagem suportado — salva o original
        }

        let finalBuffer = file.buffer
        let finalContentType = file.mimetype
        let width = 0
        let height = 0
        let avifPath = ""
        let webpPath = ""

        // Mapa de variantes responsivas: { avif: {400: path,...}, webp: {400: path,...} }
        let sizes = null

        if (file.mimetype !== "image/gif" && !animated) {
            const base = sharp(file.buffer).rotate()

            // Gera cada largura em AVIF (formato principal) e WebP (fallback)
            const variants = {}
            try {
                for (const sizeW of SIZES) {
                    const resized = base.clone().resize({
                        width: sizeW,
                        height: sizeW,
                        fit: "inside",
                        withoutEnlargement: true
                    })
                    const [avifBuf, webpBuf] = await Promise.all([
                        resized.clone().toFormat("avif", { quality: 62 }).toBuffer(),
                        resized.clone().toFormat("webp", { quality: 82 }).toBuffer(),
                    ])
                    const [avifId, webpId] = await Promise.all([
                        uploadBuffer(avifBuf, "image/avif", file.originalname),
                        uploadBuffer(webpBuf, "image/webp", file.originalname),
                    ])
                    variants[sizeW] = {
                        avif: `/uploads/${avifId}`,
                        webp: `/uploads/${webpId}`
                    }
                    // Usa o maior tamanho como referência principal da imagem
                    avifPath = `/uploads/${avifId}`
                    webpPath = `/uploads/${webpId}`
                    finalBuffer = avifBuf
                    finalContentType = "image/avif"
                }
                sizes = variants
            } catch {
                // falha inesperada ao processar — salva o original abaixo
                sizes = null
                avifPath = ""
                webpPath = ""
                finalBuffer = file.buffer
                finalContentType = file.mimetype
            }
        }

        try {
            const meta = await sharp(finalBuffer).metadata()
            width = meta.width || 0
            height = meta.height || 0
        } catch {
            // dimensões desconhecidas
        }

        if (!avifPath && !webpPath) {
            const id = await uploadBuffer(finalBuffer, finalContentType, file.originalname)
            avifPath = ""
            webpPath = `/uploads/${id}`
        }

        images.push({ avifPath, webpPath, path: webpPath || avifPath, width, height, sizes })
    }
    return images
}

function objetoIdsDeImagem(item) {
    // Aceita strings (paths) ou metas {avifPath, webpPath, path, sizes}
    const paths = []
    if (typeof item === "string") {
        paths.push(item)
    } else if (item && typeof item === "object") {
        if (typeof item.avifPath === "string") paths.push(item.avifPath)
        if (typeof item.webpPath === "string") paths.push(item.webpPath)
        if (typeof item.path === "string") paths.push(item.path)
        // Variantes responsivas (GridFS guarda cada largura como objeto separado)
        if (item.sizes && typeof item.sizes === "object") {
            for (const w of Object.values(item.sizes)) {
                if (typeof w?.avif === "string") paths.push(w.avif)
                if (typeof w?.webp === "string") paths.push(w.webp)
            }
        }
    }
    return paths
        .map(p => String(p).split("/").pop())
        .filter(idStr => ObjectId.isValid(idStr))
}

async function deletarImagensGridFS(itens) {
    const bucket = getBucket()
    await Promise.allSettled((itens || []).flatMap(objetoIdsDeImagem).map(async (idStr) => {
        try {
            await bucket.delete(new ObjectId(idStr))
        } catch {
            // arquivo já não existe no GridFS — ignora
        }
    }))
}

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
        // Remove _id, imagesPath, imagePath e imagesMeta para criar uma cópia limpa
        const { _id, imagesPath, imagePath, imagesMeta, ...cloneData } = result
        res.status(200).json(cloneData)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

/* ==================================================
   LISTAR PLANTAS (com filtros opcionais)
   Projeção enxuta: só os campos usados pelo catálogo/cards.
   Os detalhes completos vêm do GET /plant/:id.
================================================== */
const LIST_PROJECTION = {
    _id: 1, name: 1, scientificName: 1, simpleDescription: 1,
    imagesPath: 1, imagePath: 1, imagesMeta: 1,
    type: 1, light: 1, height: 1, flowercolor: 1, dificulty: 1,
    toxicity: 1, origin: 1
}

plantRoutes.route("/plant").get(async function (req, res) {
    const db_connect = dbo.getDb()
    try {
        const { origin, flowercolor, light, water, soil, toxicity, dificulty, type, height, search } = req.query
        const filter = {}
        if (origin) filter.origin = origin
        if (flowercolor) filter.flowercolor = flowercolor
        if (light) filter.light = light
        if (water) filter.water = water
        if (soil) filter.soil = soil
        if (toxicity) filter.toxicity = toxicity
        if (dificulty) filter.dificulty = dificulty
        if (type) filter.type = type
        if (height) filter.height = height
        if (search) {
            const safeRegex = searchRegex(search)
            filter.$or = [
                { name: safeRegex },
                { scientificName: safeRegex }
            ]
        }

        const result = await db_connect.collection("plants")
            .find(filter, { projection: LIST_PROJECTION })
            .toArray()
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
    let imagensSalvas = []
    try {
        if (files.length > 0) {
            imagensSalvas = await salvarImagensGridFS(files)
        }
        console.log(`[plant/add] recebido ${files.length} arquivo(s)`)
        const imagePaths = imagensSalvas.map(i => i.path)
        const imagesMeta = imagensSalvas
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
            imagePath: imagePaths[0] || "",
            imagesMeta
        }

        const result = await db_connect.collection("plants").insertOne(myobj)
        res.status(201).json({ result, imagesReceived: files.length, imagesPath: imagePaths })
    } catch (error) {
        if (imagensSalvas.length > 0) await deletarImagensGridFS(imagensSalvas)
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
        const mantidasPaths = [...new Set(
            [].concat(req.body.imagesPath || [])
                .filter(p => typeof p === "string" && p.startsWith("/uploads/") && p.length > 10)
        )]
        let docAtualSeguro = req.body.imagesMeta || []
        if (typeof docAtualSeguro === "string") {
            try { docAtualSeguro = JSON.parse(docAtualSeguro) || [] } catch { docAtualSeguro = [] }
        }
        const imagensManitdasMeta = (Array.isArray(docAtualSeguro) ? docAtualSeguro : [])
            .filter(m => m && (typeof m.path === "string" || typeof m.webpPath === "string") && mantidasPaths.includes(m.path || m.webpPath))
        let novasImages = []
        try {
            if (files.length > 0) {
                novasImages = await salvarImagensGridFS(files)
                console.log(`[plant/:id PUT] recebido ${files.length} arquivo(s)`)
            }
            if (files.length > 0 || req.body.imagesPath !== undefined) {
                const novasPaths = novasImages.map(i => i.path)
                const imagensFinal = [...mantidasPaths, ...novasPaths]
                updateFields.imagesPath = imagensFinal
                updateFields.imagePath = imagensFinal[0] || ""
                updateFields.imagesMeta = [...imagensManitdasMeta, ...novasImages]
                const docAtual = await db_connect.collection("plants").findOne(myquery)
                const antigasPaths = docAtual?.imagesPath?.length > 0
                    ? docAtual.imagesPath
                    : (docAtual?.imagePath ? [docAtual.imagePath] : [])
                const antigasMetas = Array.isArray(docAtual?.imagesMeta) ? docAtual.imagesMeta : []
                const removidas = antigasPaths.filter(p => !imagensFinal.includes(p))
                // Deleta os objectIds (webp + avif) das imagens removidas, incluindo vias de metas antigas
                const metasRemovidas = antigasMetas.filter(m => m && removidas.includes(m.path || m.webpPath))
                await deletarImagensGridFS([...removidas, ...metasRemovidas])
            }
        } catch (error) {
            if (novasImages.length > 0) await deletarImagensGridFS(novasImages)
            throw error
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
        const doc = await db_connect.collection("plants").findOne({ _id: new ObjectId(id) })
        if (!doc) {
            return res.status(404).json({ message: "Planta não encontrada" })
        }

        const imagens = doc.imagesPath?.length > 0
            ? doc.imagesPath
            : (doc.imagePath ? [doc.imagePath] : [])
        const metas = Array.isArray(doc.imagesMeta) ? doc.imagesMeta : []

        await db_connect.collection("plants").deleteOne({ _id: new ObjectId(id) })
        // Remove favoritos órfãos mantendo a contagem de favoritos fiel
        await db_connect.collection("favorites").deleteMany({ plantId: new ObjectId(id) }).catch(() => {})
        await deletarImagensGridFS([...imagens, ...metas])
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
    try {
        const all = await loadAllCollections()
        res.status(200).json(all)
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar coleções: " + error.message })
    }
})

// LISTAR ELEMENTOS DE UMA COLEÇÃO DINAMICAMENTE
plantRoutes.route("/collections/:name").get(async function (req, res) {
    const colecaoAlvo = req.params.name
    if (!COLLECTIONS_SET.has(colecaoAlvo)) {
        return res.status(404).json({ message: "Coleção inválida" })
    }
    const db_connect = dbo.getDb()
    try {
        const result = await db_connect.collection(colecaoAlvo).find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: `Erro ao buscar itens de ${colecaoAlvo}: ` + error.message })
    }
})

// ADICIONAR ELEMENTO EM UMA COLEÇÃO DINAMICAMENTE
plantRoutes.route("/collections/:name/add").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const colecaoAlvo = req.params.name
    if (!COLLECTIONS_SET.has(colecaoAlvo)) {
        return res.status(404).json({ message: "Coleção inválida" })
    }
    const db_connect = dbo.getDb()
    const novoItem = { name: req.body.name }
    try {
        const result = await db_connect.collection(colecaoAlvo).insertOne(novoItem)
        clearCollectionsCache()
        res.status(201).json({ _id: result.insertedId, name: req.body.name })
    } catch (error) {
        res.status(500).json({ message: `Erro ao salvar em ${colecaoAlvo}: ` + error.message })
    }
})

// DELETAR ELEMENTO DE UMA COLEÇÃO DINAMICAMENTE
plantRoutes.route("/collections/:name/:id").delete(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const colecaoAlvo = req.params.name
    if (!COLLECTIONS_SET.has(colecaoAlvo)) {
        return res.status(404).json({ message: "Coleção inválida" })
    }
    const db_connect = dbo.getDb()
    const id = req.params.id

    try {
        let filtro = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id }
        let result = await db_connect.collection(colecaoAlvo).deleteOne(filtro)

        if (result.deletedCount === 0 && ObjectId.isValid(id)) {
            result = await db_connect.collection(colecaoAlvo).deleteOne({ _id: id })
        }

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Item não encontrado." })
        }

        clearCollectionsCache()
        res.status(200).json({ message: "Item deletado com sucesso!" })
    } catch (error) {
        res.status(500).json({ message: `Erro ao deletar de ${colecaoAlvo}: ` + error.message })
    }
})

module.exports = plantRoutes