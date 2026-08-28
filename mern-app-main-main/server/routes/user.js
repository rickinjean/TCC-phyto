const express = require("express")
const userRoutes = express.Router()
const dbo = require("../db/conn")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken, authorizeRoles, signToken } = require("../middleware/auth")
const bcrypt = require("bcrypt")

userRoutes.route('/user/login').post(async function (req, res) {
    const db_connect = dbo.getDb()

    const { user, senha } = req.body;

    try {
        const usuario = await db_connect.collection("users").findOne({ user })

        if (!usuario) {
            return res.status(400).json({ mensagem: 'Usuário ou senha incorretos' });
        }

        if (!usuario.senha) {
            return res.status(400).json({ mensagem: 'Esta conta usa login social. Faça login com Google ou GitHub.' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(400).json({ mensagem: 'Usuário ou senha incorretos' });
        }

        const token = signToken({ userId: usuario._id, tipo: usuario.function, name: usuario.name, avatar: usuario.avatar || null })

        res.json({ mensagem: 'Login bem-sucedido', token });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro no servidor' });
    }
}
);

userRoutes.route('/user/register').post(async function (req, res) {
    const db_connect = dbo.getDb()

    const { nome, user, email, senha } = req.body;
    const tipoUsuario = "User"

    try {
        if (!nome || !user || !email || !senha) {
            return res.status(400).json({ mensagem: 'Nome, usuário, email e senha são obrigatórios' });
        }

        if (user.length < 3) {
            return res.status(400).json({ mensagem: 'O nome de usuário deve ter pelo menos 3 caracteres' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(user)) {
            return res.status(400).json({ mensagem: 'O nome de usuário deve conter apenas letras, números e underscore' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ mensagem: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const userExistente = await db_connect.collection("users").findOne({ user })
        if (userExistente) {
            return res.status(400).json({ mensagem: 'Este nome de usuário já está em uso' });
        }

        const emailExistente = await db_connect.collection("users").findOne({ email })
        if (emailExistente) {
            return res.status(400).json({ mensagem: 'Este email já está cadastrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const novoUsuario = {
            name: nome,
            user,
            email,
            senha: senhaHash,
            function: tipoUsuario,
        };

        const result = await db_connect.collection("users").insertOne(novoUsuario);

        console.log("Usuário cadastrado com sucesso:", result.insertedId);
        return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
    }
}
);


// This section will help you get a list of all the users.
userRoutes.route("/user").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
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
userRoutes.route("/user/:id").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
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
userRoutes.route("/user/add").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    const { name, user, email, function: tipo, senha } = req.body

    if (!name || !email || !senha) {
        return res.status(400).json({ message: "Nome, email e senha são obrigatórios" })
    }

    try {
        const salt = await bcrypt.genSalt(10)
        const senhaHash = await bcrypt.hash(senha, salt)
        const myobj = {
            name,
            user,
            email,
            senha: senhaHash,
            function: tipo || "User"
        }
        const result = await db_connect.collection("users").insertOne(myobj)
        console.log("1 document created")
        res.status(201).json(result)
    } catch (error) {
        res.status(409).json({ message: error.message })
    }
})

// This section will help you update a user by id.
userRoutes.route("/update/:id").put(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
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
userRoutes.route("/user/:id").delete(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    const myquery = { _id: new ObjectId(req.params.id) }
    try {
        const result = await db_connect.collection("users").deleteOne(myquery)
        console.log("1 document deleted")
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: "Erro ao deletar usuário" })
    }
})

module.exports = userRoutes
