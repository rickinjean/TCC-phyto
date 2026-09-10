require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
const mongodb = require("mongodb")
const pinoHttp = require("pino-http")
const logger = require("./logger")
const { getBucket } = require("./gridfs")

if (!process.env.JWT_SECRET) {
    logger.error("ERRO: JWT_SECRET não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

if (!process.env.JWT_REFRESH_SECRET) {
    logger.error("ERRO: JWT_REFRESH_SECRET não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const port = process.env.PORT || 5050

app.set('trust proxy', 1)

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER

// Headers de segurança (helmet). CSP com política restrita compatível com o
// build do CRA (CSP desabilitado antes para evitar regressão). CORP é
// liberado (cross-origin) só no dev, onde o frontend em :3000 carrega
// imagens da API em :5050; em produção client e API são mesma origem.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https://lh3.googleusercontent.com", "https://avatars.githubusercontent.com"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
        },
    },
    crossOriginResourcePolicy: isProduction ? { policy: "same-origin" } : { policy: "cross-origin" },
}))

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map(s => s.trim().replace(/\/+$/, "").toLowerCase())
    .filter(Boolean)

function normalizeOrigin(origin) {
    if (!origin) return ""
    return origin.trim().replace(/\/+$/, "").toLowerCase()
}

function isSameOrigin(req, origin) {
    const { protocol, host } = req
    if (!host) return false
    return normalizeOrigin(`${protocol}://${host}`) === normalizeOrigin(origin)
}

app.use(cors({
    origin: function (origin, callback) {
        const norm = normalizeOrigin(origin)

        // Requisições sem header Origin (server-to-server, health checks etc.) são liberadas
        if (!origin || corsOrigins.includes(norm)) {
            return callback(null, true)
        }

        // Permite a própria origem do servidor (quando o Express serve o frontend estático
        // na mesma porta, como no deploy do Render)
        if (isSameOrigin(req, origin)) {
            return callback(null, true)
        }

        callback(new Error("Origin not allowed by CORS"))
    },
    credentials: true
}))

// Log estruturado de requisições HTTP (pino-http). Ignora /uploads (excesso
// de tráfego de imagem) para não poluir os logs.
app.use(pinoHttp({
    logger,
    autoLogging: {
        ignore: function (req) { return req.url.startsWith("/uploads") },
    },
    serializers: {
        res(res) { return { statusCode: res.statusCode } },
        req(req) { return { method: req.method, url: req.url } },
    },
}))

app.use(express.json({ limit: "2mb" }))

// Compressão gzip/brotli. Pula imagens (já compactadas por sharp) para economizar CPU.
app.use(compression({
    threshold: 1024,
    filter: function(req, res) {
        if (req.headers["x-no-compression"]) return false
        const type = res.getHeader("Content-Type")
        if (typeof type === "string" && /^image\//.test(type)) return false
        return compression.filter(req, res)
    },
}))

// Imagens: prioriza o GridFS (MongoDB) e cai para arquivos antigos salvos em disco
const uploadsDir = path.join(__dirname, 'uploads')

app.use('/uploads', function (req, res) {
    const nome = decodeURIComponent(req.path.replace(/^\//, ""))

    if (!nome) return res.status(404).json({ message: "Imagem não encontrada" })

    // Proteção contra path traversal: o nome é um único segmento de URL e não
    // deve conter separadores de caminho nem ".."
    if (nome.includes("/") || nome.includes("\\") || nome.includes("..")) {
        return res.status(404).json({ message: "Imagem não encontrada" })
    }

    // Nomes são ObjectIds do GridFS (imutáveis por upload): cache longo é seguro
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

    if (mongodb.ObjectId.isValid(nome)) {
        const stream = getBucket().openDownloadStream(new mongodb.ObjectId(nome))
        stream.on("error", serveFallback)
        stream.pipe(res)
        return
    }

    serveFallback()

    function serveFallback() {
        const caminhoDisco = path.normalize(path.join(uploadsDir, nome))
        if (caminhoDisco.startsWith(uploadsDir + path.sep) && fs.existsSync(caminhoDisco)) {
            return res.sendFile(caminhoDisco)
        }
        res.status(404).json({ message: "Imagem não encontrada" })
    }
})

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { mensagem: "Muitas tentativas de login. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
})

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { mensagem: "Muitas tentativas de renovação de sessão. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use("/user/login", loginLimiter)
app.use("/user/register", loginLimiter)
app.use("/auth/refresh", refreshLimiter)

process.on("unhandledRejection", (reason) => {
    logger.error(reason, "Rejeição não tratada")
})

process.on("uncaughtException", (error) => {
    logger.error(error, "Exceção não tratada")
    process.exit(1)
})

app.use(require("./routes/auth"))
app.use(require("./routes/user"))
app.use(require("./routes/sessions"))
app.use(require("./routes/plant"))
app.use(require("./routes/userLists"))
const suggestionsRoutes = require("./routes/suggestions")
app.use(suggestionsRoutes)
app.use(require("./routes/messages"))
app.use(require("./routes/stats"))

const dbo = require("./db/conn")

app.get("/health", function(req, res) {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

const SITEMAP_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
const SITEMAP_PADDING = "~"
const SITE_URL = process.env.SITE_URL || "https://tcc-phyto.onrender.com"

function encodeId(id) {
    if (!id) return id
    const hex = String(id)
    let num = BigInt("0x" + hex)
    let result = ""
    const base = BigInt(SITEMAP_ALPHABET.length)
    while (num > 0n) {
        result = SITEMAP_ALPHABET[Number(num % base)] + result
        num = num / base
    }
    return (result || "0") + SITEMAP_PADDING
}

// Sitemap dinâmico: inclui páginas estáticas + todas as fichas de plantas.
// Substitui o sitemap.xml estático, que não cobria /plantdetails/:id.
app.get("/sitemap.xml", async function (req, res) {
    const db_connect = dbo.getDb()
    const today = new Date().toISOString().slice(0, 10)
    let plants = []
    try {
        plants = await db_connect.collection("plants").find({}, { projection: { _id: 1 } }).toArray()
    } catch (error) {
        logger.error(error, "Erro ao gerar sitemap")
    }

    const urls = []
    const staticUrls = [
        { path: "/", priority: "1.0", freq: "weekly" },
        { path: "/inicio", priority: "0.9", freq: "weekly" },
        { path: "/plantlist", priority: "0.9", freq: "daily" },
        { path: "/Sobre", priority: "0.6", freq: "monthly" },
    ]
    for (const u of staticUrls) {
        urls.push(`  <url>\n    <loc>${SITE_URL}${u.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    }
    for (const p of plants) {
        const encoded = encodeId(p._id)
        urls.push(`  <url>\n    <loc>${SITE_URL}/plantdetails/${encoded}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`
    res.setHeader("Content-Type", "application/xml")
    res.setHeader("Cache-Control", "no-cache")
    res.send(xml)
})

if (isProduction) {
    const clientBuildPath = path.join(__dirname, "..", "client", "build")

    // Assets do CRA trazem nomes hasheados: cache de 1 ano é seguro.
    // index.html é servido sem cache para refletir novos builds imediatamente.
    app.use(express.static(clientBuildPath, {
        index: false,
        setHeaders: function(res, filePath) {
            if (filePath.includes(`${path.sep}static${path.sep}`)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
            } else if (filePath.endsWith("index.html")) {
                res.setHeader("Cache-Control", "no-cache")
            } else {
                res.setHeader("Cache-Control", "public, max-age=3600")
            }
        },
    }))
    app.get("*", function(req, res) {
        res.setHeader("Cache-Control", "no-cache")
        res.sendFile(path.join(clientBuildPath, "index.html"))
    })
} else {
    app.get("/", function(req, res) {
        res.send("App is running")
    })
}

function executarLimpezaSugestoes() {
    suggestionsRoutes.limparSugestoesEncerradas()
        .then(r => {
            if (r.deletedCount > 0) {
                logger.info({ qtd: r.deletedCount }, "[suggestions] sugestões encerradas antigas removidas")
            }
        })
        .catch(err => logger.error(err, "[suggestions] Erro na limpeza automática"))
}

dbo.connectToMongoDB(function (error) {
    if (error) {
        logger.fatal({ err: error }, "Falha ao conectar ao MongoDB")
        process.exit(1)
    }

    executarLimpezaSugestoes()
    setInterval(executarLimpezaSugestoes, 6 * 60 * 60 * 1000)

    app.listen(port, () => {
        logger.info({ port }, "Servidor rodando")
    })
})