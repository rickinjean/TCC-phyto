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
const { getBucket } = require("./gridfs")

if (!process.env.JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const port = process.env.PORT || 5050

app.set('trust proxy', true)

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

app.use("/user/login", loginLimiter)
app.use("/user/register", loginLimiter)

process.on("unhandledRejection", (reason) => {
    console.error("Rejeição não tratada:", reason)
})

process.on("uncaughtException", (error) => {
    console.error("Exceção não tratada:", error)
})

app.use(require("./routes/auth"))
app.use(require("./routes/user"))
app.use(require("./routes/plant"))
app.use(require("./routes/favorites"))
app.use(require("./routes/messages"))
app.use(require("./routes/stats"))

const dbo = require("./db/conn")

app.get("/health", function(req, res) {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
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

dbo.connectToMongoDB(function (error) {
    if (error) throw error

    app.listen(port, () => {
        console.log("Servidor rodando na porta: " + port)
    })
})