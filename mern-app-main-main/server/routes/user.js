const express = require("express")
const userRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const JWT_SECRET = "secret-key"

userRoutes.route('/user/login').post(async function (req, res) {
    const db_connect = dbo.getDb()

    const { email, senha } = req.body;

    try {
        const usuario = await db_connect.collection("users").findOne({ email })

        if (!usuario) {
            return res.status(400).json({ mensagem: 'Usuário não encontrado' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(400).json({ mensagem: 'Senha incorreta' });
        }

        const token = jwt.sign({ userId: usuario._id, tipo: usuario.function }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ mensagem: 'Login bem-sucedido', token });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro no servidor' });
    }
}
);

userRoutes.route('/user/register').post(async function (req, res) {
    const db_connect = dbo.getDb()

    const { nome, email, senha, function: tipo } = req.body;

    try {
        const userExistente = await db_connect.collection("users").findOne({ email })

        if (userExistente) {
            return res.status(400).json({ mensagem: 'Usuário já cadastrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const novoUsuario = {
            name: nome,
            email,
            senha: senhaHash,
            function: tipo, // Tipo de perfil do usuário (ADM ou User)
        };

        const result = await db_connect.collection("users").insertOne(novoUsuario);

        console.log("Usuário cadastrado com sucesso:", result.insertedId);
        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário', erro: error.message });
    }
}
);


// This section will help you get a list of all the users.
userRoutes.route("/user").get(async function (req, res) {
    const db_connect = dbo.getDb()
    // console.log("ROUTE: /user")

    try {
        const result = await db_connect.collection("users").find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
})

// This section will help you get a single user by id
userRoutes.route("/user/:id").get(async function (req, res) {
    const db_connect = dbo.getDb()
    const myquery = { _id: new ObjectId(req.params.id) }
    try {
        const result = await db_connect.collection("users").findOne(myquery)
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
})

// This section will help you create a new user.
userRoutes.route("/user/add").post(async function (req, res) {
    const db_connect = dbo.getDb()
    const myobj = {
        name: req.body.name,
        user: req.body.user,
        email: req.body.email,
        function: req.body.function
    }
    try {
        const result = await db_connect.collection("users").insertOne(myobj)
        console.log("1 document created")
        res.status(201).json(result)
    } catch (error) {
        res.status(409).json({ message: error.message })
    }
})

// This section will help you update a user by id.
userRoutes.route("/update/:id").post(async function (req, res) {
    const db_connect = dbo.getDb()
    const myquery = { _id: new ObjectId(req.params.id) }
    const newvalues = {
        $set: {
            name: req.body.name,
            user: req.body.user,
            email: req.body.email,
            function: req.body.function
        }
    }
    try {
        const result = await db_connect.collection("users").updateOne(myquery, newvalues)
        console.log("1 document updated")
        res.status(200).json(result)
    } catch (error) {
        res.status(409).json({ message: error.message })
    }
})

// This section will help you delete a user
userRoutes.route("/:id").delete(async function (req, res) {
    const db_connect = dbo.getDb()
    const myquery = { _id: new ObjectId(req.params.id) }
    try {
        const result = await db_connect.collection("users").deleteOne(myquery)
        console.log("1 document deleted")
        res.status(200).json(result)
    } catch {
        res.status(204).json({ message: "It is gone!" })
    }
})

module.exports = userRoutes
