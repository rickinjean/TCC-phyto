const express = require("express")
const userRoutes = express.Router()
const dbo = require("../db/conn")
const crypto = require("crypto")
const ObjectId = require("mongodb").ObjectId
const { authenticateToken, authorizeRoles, signToken } = require("../middleware/auth")
const { enviarEmailConfirmacao, smtpConfigurado } = require("../mailer")
const bcrypt = require("bcrypt")

function escapeRegex(texto) {
    return (texto || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function validarSenha(senha) {
    if (typeof senha !== "string") return "Senha inválida"
    if (senha.length < 8) return "A senha deve ter pelo menos 8 caracteres"
    if (/\s/.test(senha)) return "A senha não pode conter espaços"
    if (!/[A-Z]/.test(senha)) return "A senha deve conter pelo menos 1 letra maiúscula"
    if (!/[a-z]/.test(senha)) return "A senha deve conter pelo menos 1 letra minúscula"
    if (!/[0-9]/.test(senha)) return "A senha deve conter pelo menos 1 número"
    if (!/[!@#$%&*]/.test(senha)) return "A senha deve conter pelo menos 1 caractere especial (! @ # $ % & *)"
    return null
}

userRoutes.route('/user/login').post(async function (req, res) {
    const db_connect = dbo.getDb()

    const identificador = (req.body.user || "").toString().trim().toLowerCase()
    const senha = req.body.senha

    if (!identificador || !senha) {
        return res.status(400).json({ mensagem: 'Usuário/email e senha são obrigatórios' });
    }

    try {
        const exp = escapeRegex(identificador)
        const usuario = await db_connect.collection("users").findOne({
            $or: [
                { user: identificador },
                { user: { $regex: new RegExp(`^${exp}$`, "i") } },
                { email: { $regex: new RegExp(`^${exp}$`, "i") } }
            ]
        })

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

        if (usuario.emailVerified === false) {
            return res.status(403).json({ mensagem: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam).' });
        }

        const token = signToken({ userId: usuario._id, tipo: usuario.function, name: usuario.name || usuario.user, avatar: usuario.avatar || null })

        res.json({ mensagem: 'Login bem-sucedido', token });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ mensagem: 'Erro no servidor' });
    }
}
);

userRoutes.route('/user/register').post(async function (req, res) {
    const db_connect = dbo.getDb()

    const user = (req.body.user || req.body.nome || "").toString().trim()
    const email = (req.body.email || "").toString().trim().toLowerCase()
    const senha = req.body.senha
    const tipoUsuario = "User"

    try {
        if (!user || !email || !senha) {
            return res.status(400).json({ mensagem: 'Nome de usuário, email e senha são obrigatórios' });
        }

        if (!/^[a-zA-Z0-9._]{3,20}$/.test(user)) {
            return res.status(400).json({ mensagem: 'Nome de usuário deve ter de 3 a 20 caracteres (letras, números, ponto ou underline)' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ mensagem: 'Email inválido' });
        }

        const erroSenha = validarSenha(senha);
        if (erroSenha) {
            return res.status(400).json({ mensagem: erroSenha });
        }

        const expUser = escapeRegex(user)
        const userExistente = await db_connect.collection("users").findOne({ user: { $regex: new RegExp(`^${expUser}$`, "i") } })
        if (userExistente) {
            return res.status(400).json({ mensagem: 'Este nome de usuário já está em uso' });
        }

        const expEmail = escapeRegex(email)
        const emailExistente = await db_connect.collection("users").findOne({ email: { $regex: new RegExp(`^${expEmail}$`, "i") } })
        if (emailExistente) {
            return res.status(400).json({ mensagem: 'Este email já está cadastrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const novoUsuario = {
            name: user,
            user,
            email,
            senha: senhaHash,
            function: tipoUsuario,
            emailVerified: !smtpConfigurado,
        }

        if (smtpConfigurado) {
            novoUsuario.emailVerified = false
            novoUsuario.verificationToken = crypto.randomBytes(32).toString("hex")
            novoUsuario.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
        }

        const result = await db_connect.collection("users").insertOne(novoUsuario);

        if (smtpConfigurado) {
            const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"
            const link = `${FRONTEND_URL}/verify?token=${novoUsuario.verificationToken}`
            try {
                await enviarEmailConfirmacao(user, email, link)
            } catch (erroEmail) {
                console.error("Erro ao enviar email de confirmação:", erroEmail.message)
            }
        }

        console.log("Usuário cadastrado com sucesso:", result.insertedId);
        return res.status(201).json({
            mensagem: smtpConfigurado
                ? 'Cadastro realizado! Confirme seu e-mail no link que enviamos para ativar a conta.'
                : 'Usuário cadastrado com sucesso',
            precisaConfirmarEmail: smtpConfigurado
        });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
    }
}
);

userRoutes.route('/user/verify').get(async function (req, res) {
    const db_connect = dbo.getDb()
    const { token } = req.query

    if (!token) {
        return res.status(400).json({ mensagem: 'Token de verificação ausente' })
    }

    try {
        const usuario = await db_connect.collection("users").findOne({ verificationToken: token })

        if (!usuario) {
            return res.status(400).json({ mensagem: 'Link de verificação inválido ou já utilizado' })
        }

        const expirado = usuario.verificationExpires && new Date(usuario.verificationExpires) < new Date()
        if (expirado) {
            return res.status(400).json({ mensagem: 'Link de verificação expirado. Faça o cadastro novamente.' })
        }

        await db_connect.collection("users").updateOne(
            { _id: usuario._id },
            { $set: { emailVerified: true }, $unset: { verificationToken: "", verificationExpires: "" } }
        )

        return res.json({ mensagem: 'E-mail confirmado com sucesso! Você já pode entrar.' })
    } catch (erro) {
        console.error(erro)
        return res.status(500).json({ mensagem: 'Erro no servidor' })
    }
}
);


// This section will help you get a list of all the users.
userRoutes.route("/user").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    // console.log("ROUTE: /user")

    try {
        const result = await db_connect.collection("users")
            .find({}, { projection: { senha: 0, verificationToken: 0, verificationExpires: 0 } })
            .toArray()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: "Erro ao listar usuários" })
    }
})

// This section will help you get a single user by id
userRoutes.route("/user/:id").get(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }
    const myquery = { _id: new ObjectId(req.params.id) }
    try {
        const result = await db_connect.collection("users").findOne(myquery, { projection: { senha: 0, verificationToken: 0, verificationExpires: 0 } })
        if (!result) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar usuário" })
    }
})

// This section will help you create a new user.
userRoutes.route("/user/add").post(authenticateToken, authorizeRoles("ADM"), async function (req, res) {
    const db_connect = dbo.getDb()
    const { name, user, email, function: tipo, senha } = req.body
    const ROLES_VALIDAS = ["User", "ADM"]

    if (!name || !email || !senha) {
        return res.status(400).json({ message: "Nome, email e senha são obrigatórios" })
    }

    if (tipo && !ROLES_VALIDAS.includes(tipo)) {
        return res.status(400).json({ message: "Função inválida. Use 'User' ou 'ADM'" })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Email inválido" })
    }

    const erroSenha = validarSenha(senha)
    if (erroSenha) {
        return res.status(400).json({ message: erroSenha })
    }

    try {
        const salt = await bcrypt.genSalt(10)
        const senhaHash = await bcrypt.hash(senha, salt)
        const myobj = {
            name,
            user,
            email,
            senha: senhaHash,
            function: tipo || "User",
            emailVerified: true
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
    const ROLES_VALIDAS = ["User", "ADM"]

    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }

    if (req.body.function && !ROLES_VALIDAS.includes(req.body.function)) {
        return res.status(400).json({ message: "Função inválida. Use 'User' ou 'ADM'" })
    }

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
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "ID inválido" })
    }
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
