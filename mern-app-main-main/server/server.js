const express = require("express")
const app = express()
const cors = require("cors")

const port = 5050

app.use(cors())
app.use(express.json())
app.use(require("./routes/user")) // cria as rotas para manipulação de usuários

const dbo = require("./db/conn")

app.get("/", function(req, res) {
    res.send("App is running")
})

dbo.connectToMongoDB(function (error) {
    if (error) throw error

    app.listen(port, () => {
        console.log("Servidor rodando na porta: " + port)
    })
})