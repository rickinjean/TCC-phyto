const { Resend } = require("resend")

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM || "Phytografia <onboarding@resend.dev>"

const resendConfigurado = Boolean(RESEND_API_KEY)

let resend = null

if (resendConfigurado) {
    resend = new Resend(RESEND_API_KEY)
}

async function enviarEmailConfirmacao(nome, email, link) {
    if (!resendConfigurado) {
        throw new Error("Resend não configurado")
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

    const { error } = await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Confirme seu e-mail - Phytografia",
        text: `Olá ${safeNome}! Confirme seu e-mail clicando no link: ${link}. O link é válido por 24 horas.`,
        html,
    })

    if (error) {
        throw new Error(error.message)
    }
}

module.exports = { resendConfigurado, enviarEmailConfirmacao }
