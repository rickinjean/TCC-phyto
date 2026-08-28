const nodemailer = require("nodemailer")

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || `Phytografia <${SMTP_USER || "no-reply@phyto.com"}>`

// Verificação de e-mail só é ativa quando o SMTP está configurado.
const smtpConfigurado = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)

let transporter = null

if (smtpConfigurado) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
}

async function enviarEmailConfirmacao(nome, email, link) {
    if (!smtpConfigurado) {
        throw new Error("SMTP não configurado")
    }

    const safeNome = (nome || "").split(" ")[0] || ""

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="margin-top: 0; color: #2c3e50;">Phytografia</h2>
            <p>Olá, ${safeNome}!</p>
            <p>Confirme seu e-mail clicando no botão abaixo para ativar sua conta:</p>
            <p style="text-align: center; margin: 28px 0;">
                <a href="${link}" style="background-color: #28a745; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">Confirmar e-mail</a>
            </p>
            <p style="color: #777; font-size: 13px;">Se o botão não funcionar, copie e cole este link no navegador:<br>${link}</p>
            <p style="color: #999; font-size: 12px;">O link é válido por 24 horas.</p>
        </div>
    `

    await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "Confirme seu e-mail - Phytografia",
        text: `Olá ${safeNome}! Confirme seu e-mail clicando no link: ${link}. O link é válido por 24 horas.`,
        html,
    })
}

module.exports = { smtpConfigurado, enviarEmailConfirmacao }