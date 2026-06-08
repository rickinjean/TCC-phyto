const express = require("express")
const app = express()
const cors = require("cors")
const path = require('path');

const port = 5050

app.use(cors())
app.use(express.json())
app.use(require("./routes/user")) // cria as rotas para manipulação de usuários
app.use(require("./routes/plant")) // cria as rotas para manipulação de plantas

const dbo = require("./db/conn")

// 1. Libera o acesso aos seus arquivos .js e .css (da pasta client)
app.use(express.static(path.join(__dirname, 'client')));

// 2. Se acessar a raiz "/", redireciona direto no navegador para "/plantlist"
app.get('/', (req, res) => {
    res.redirect('/Plantlist');
});

// 3. Quando o navegador for para "/plantlist", o servidor entrega o seu index.html
app.get('/Plantlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

dbo.connectToMongoDB(function (error) {
    if (error) throw error

    app.listen(port, () => {
        console.log("Servidor rodando na porta: " + port)
    })
})