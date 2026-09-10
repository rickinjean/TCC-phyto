const { body } = require("express-validator")

const USERNAME_RE = /^[a-zA-Z0-9._]{3,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const registerValidation = [
    body("user")
        .trim()
        .notEmpty().withMessage("Nome de usuário é obrigatório")
        .bail()
        .matches(USERNAME_RE).withMessage("Nome de usuário deve ter de 3 a 20 caracteres (letras, números, ponto ou underline)"),
    body("email")
        .trim()
        .normalizeEmail({ gmail_remove_dots: false })
        .notEmpty().withMessage("Email é obrigatório")
        .bail()
        .matches(EMAIL_RE).withMessage("Email inválido"),
    body("senha")
        .isString().withMessage("Senha inválida")
        .bail()
        .isLength({ min: 8 }).withMessage("A senha deve ter pelo menos 8 caracteres")
        .bail()
        .matches(/^\S*$/).withMessage("A senha não pode conter espaços")
        .bail()
        .matches(/[A-Z]/).withMessage("A senha deve conter pelo menos 1 letra maiúscula")
        .bail()
        .matches(/[a-z]/).withMessage("A senha deve conter pelo menos 1 letra minúscula")
        .bail()
        .matches(/[0-9]/).withMessage("A senha deve conter pelo menos 1 número")
        .bail()
        .matches(/[!@#$%&*]/).withMessage("A senha deve conter pelo menos 1 caractere especial (! @ # $ % & *)"),
]

const loginValidation = [
    body("user").trim().notEmpty().withMessage("Usuário/email é obrigatório"),
    body("senha").notEmpty().withMessage("Senha é obrigatória"),
]

const messageValidation = [
    body("nome").trim().notEmpty().withMessage("Nome é obrigatório").isLength({ max: 100 }).withMessage("Nome muito longo"),
    body("email").trim().isEmail().withMessage("Email inválido"),
    body("assunto").trim().notEmpty().withMessage("Assunto é obrigatório").isLength({ max: 200 }).withMessage("Assunto muito longo"),
    body("mensagem").trim().notEmpty().withMessage("Mensagem é obrigatória").isLength({ max: 2000 }).withMessage("Mensagem muito longa"),
]

const suggestionValidation = [
    body("tipo").isIn(["nova", "correcao"]).withMessage("Tipo de sugestão inválido"),
]

module.exports = {
    registerValidation,
    loginValidation,
    messageValidation,
    suggestionValidation,
}