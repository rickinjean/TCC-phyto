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

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000"
app.use(cors({ origin: corsOrigin, credentials: true }))
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

app.use(require("./routes/user"))
app.use(require("./routes/plant"))
app.use(require("./routes/favorites"))
app.use(require("./routes/messages"))
app.use(require("./routes/stats"))

const dbo = require("./db/conn")

app.get("/", function(req, res) {
    res.send("App is running")
})

app.get("/health", function(req, res) {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

dbo.connectToMongoDB(function (error) {
    if (error) throw error

    app.listen(port, () => {
        console.log("Servidor rodando na porta: " + port)
    })
})