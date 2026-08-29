require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const mongodb = require("mongodb")
const { getBucket } = require("./gridfs")

if (!process.env.JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const port = process.env.PORT || 5050

app.set('trust proxy', true)

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
        if (!origin || origin === "null" || corsOrigins.includes(norm)) {
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
app.use(express.json())

// Imagens: prioriza o GridFS (MongoDB) e cai para arquivos antigos salvos em disco
app.use('/uploads', function (req, res) {
    const nome = decodeURIComponent(req.path.replace(/^\//, ""))

    const serveFallback = () => {
        const caminhoDisco = path.join(__dirname, 'uploads', nome)
        if (fs.existsSync(caminhoDisco)) return res.sendFile(caminhoDisco)
        res.status(404).json({ message: "Imagem não encontrada" })
    }

    if (!nome) return serveFallback()

    let id = null
    if (mongodb.ObjectId.isValid(nome)) {
        id = new mongodb.ObjectId(nome)
    } else {
        return serveFallback()
    }

    const stream = getBucket().openDownloadStream(id)
    stream.on("error", serveFallback)
    stream.pipe(res)
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

app.use(require("./routes/auth"))
app.use(require("./routes/user"))
app.use(require("./routes/plant"))
app.use(require("./routes/favorites"))
app.use(require("./routes/messages"))
app.use(require("./routes/stats"))

const dbo = require("./db/conn")

if (process.env.NODE_ENV === "production" || process.env.RENDER) {
    const clientBuildPath = path.join(__dirname, "..", "client", "build")
    app.use(express.static(clientBuildPath))
    app.get("*", function(req, res) {
        res.sendFile(path.join(clientBuildPath, "index.html"))
    })
} else {
    app.get("/", function(req, res) {
        res.send("App is running")
    })
}

app.get("/health", function(req, res) {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

dbo.connectToMongoDB(function (error) {
    if (error) throw error

    app.listen(port, () => {
        console.log("Servidor rodando na porta: " + port)
    })
})