require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const cors = require("cors")
const rateLimit = require("express-rate-limit")

if (!process.env.JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não está definida. Crie um arquivo .env na pasta server/ com essa variável.")
    process.exit(1)
}

const port = process.env.PORT || 5050
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "(não definida - usando localhost)")

app.set('trust proxy', true)

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",")
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Origin not allowed by CORS"))
        }
    },
    credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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