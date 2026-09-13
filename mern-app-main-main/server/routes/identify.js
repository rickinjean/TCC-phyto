const express = require("express")
const router = express.Router()
const multer = require("multer")
const axios = require("axios")
const rateLimit = require("express-rate-limit")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { asyncHandler } = require("../utils")
const logger = require("../logger")

const PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all"

const ORGAOS_VALIDOS = new Set(["auto", "leaf", "flower", "fruit", "bark"])

const identifyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { mensagem: "Muitas identificações. Tente novamente em 1 hora." },
    standardHeaders: true,
    legacyHeaders: false,
})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true)
        cb(new Error("Envie apenas arquivos de imagem (JPG, PNG, WebP...)"))
    },
})

function normalizarNomeComum(commonNames, langPreferida) {
    if (!Array.isArray(commonNames)) return ""
    const langs = [...new Set([langPreferida, "por", "pt", "spa", "eng", ""].filter(Boolean))]
    for (const lang of langs) {
        const match = commonNames.find(n => n && n.lang === lang && n.value && String(n.value).trim())
        if (match) return String(match.value).trim()
    }
    const qualquer = commonNames.find(n => n && n.value && String(n.value).trim())
    return qualquer ? String(qualquer.value).trim() : ""
}

// GBIF fornece a taxonomia completa (filo, classe, ordem) sem necessidade de chave.
async function buscarTaxonomiaGBIF(gbifId) {
    if (!gbifId) return null
    try {
        const { data } = await axios.get(`https://api.gbif.org/v1/species/${encodeURIComponent(gbifId)}`, {
            timeout: 10000,
            headers: { "User-Agent": "PhytografiaTCC (trabalho academico)" },
        })
        return {
            filo: data.phylum || null,
            classe: data.className || null,
            ordem: data.order || null,
            family: data.family || null,
        }
    } catch (err) {
        logger.warn({ gbifId, err: err.message || "Erro" }, "[identify] Falha ao consultar taxonomia GBIF")
        return null
    }
}

function montarResultados(apiData, taxonomia) {
    const resultadosBrutos = Array.isArray(apiData.results) ? apiData.results : []
    const vistos = new Set()
    const resultados = []

    for (const r of resultadosBrutos) {
        const sp = r && r.species
        if (!sp) continue
        const nomeCientifico = sp.scientificNameWithoutAuthor || sp.scientificName || ""
        if (!nomeCientifico) continue

        const partes = nomeCientifico.split(/\s+/).filter(Boolean)
        const chave = partes.slice(0, 2).join(" ").toLowerCase()
        if (vistos.has(chave)) continue
        vistos.add(chave)

        resultados.push({
            score: Number(r.score) || 0,
            nomePopular: normalizarNomeComum(sp.commonNames, "por"),
            scientificName: nomeCientifico,
            authorship: sp.scientificNameAuthorship || "",
            family: (sp.family && sp.family.scientificNameWithoutAuthor) || taxonomia?.family || "",
            genus: (sp.genus && sp.genus.scientificNameWithoutAuthor) || partes[0] || "",
            species: partes.slice(1).join(" ") || "",
            filo: taxonomia?.filo || null,
            classe: taxonomia?.classe || null,
            ordem: taxonomia?.ordem || null,
            gbifId: r.gbif && r.gbif.id ? String(r.gbif.id) : null,
        })
        if (resultados.length >= 3) break
    }

    return resultados.sort((a, b) => b.score - a.score)
}

router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADM"),
    identifyLimiter,
    upload.single("image"),
    asyncHandler(async function (req, res) {
        if (!process.env.PLANTNET_API_KEY) {
            return res.status(500).json({ mensagem: "Chave da API Pl@ntNet não configurada no servidor." })
        }
        if (!req.file) {
            return res.status(400).json({ mensagem: "Envie uma imagem para identificação." })
        }

        const organ = ORGAOS_VALIDOS.has(req.body.organ) ? req.body.organ : "auto"

        const form = new FormData()
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "image/jpeg" })
        form.append("images", blob, req.file.originalname || "imagem.jpg")
        form.append("organs", organ)

        let apiData
        try {
            const response = await axios.post(PLANTNET_API_URL, form, {
                params: { "api-key": process.env.PLANTNET_API_KEY, lang: "pt" },
                timeout: 30000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            })
            apiData = response.data
        } catch (err) {
            logger.warn({ err: err.message || "Erro" }, "[identify] Falha na chamada à Pl@ntNet")
            const status = (err.response && err.response.status) || 502
            if (status === 429) {
                return res.status(429).json({ mensagem: "Cota da API Pl@ntNet atingida. Aguarde e tente novamente mais tarde." })
            }
            return res.status(502).json({ mensagem: "Serviço de identificação indisponível no momento. Tente novamente." })
        }

        // A Pl@ntNet responde com HTTP 200 mesmo para erros de negócio (corpo com "code").
        if (apiData && apiData.code) {
            const msg = String(apiData.message || "")
            if (/authentication|chave|key/i.test(msg)) {
                logger.error("[identify] Chave Pl@ntNet inválida ou expirada")
                return res.status(503).json({ mensagem: "Chave da API Pl@ntNet inválida. Verifique a configuração do servidor." })
            }
            if (/too many|quota|l[ií]mite/i.test(msg + (apiData.code || ""))) {
                return res.status(429).json({ mensagem: "Cota da API Pl@ntNet atingida. Aguarde e tente novamente." })
            }
            return res.status(422).json({ mensagem: "Não foi possível interpretar a imagem. Tente outra foto, de preferência focada na planta." })
        }

        // Identificação de baixa confiança ou vazia: ainda retorna o que houver.
        const melhor = apiData && Array.isArray(apiData.results) ? apiData.results[0] : null
        const gbifId = melhor && melhor.gbif && melhor.gbif.id
        const taxonomia = gbifId ? await buscarTaxonomiaGBIF(gbifId) : null

        const resultados = montarResultados(apiData, taxonomia)
        const temConfiancaBaixa = melhor && Number(melhor.score || 0) < 0.4

        logger.info(
            { qtd: resultados.length, organ, gbifId: gbifId || null },
            "[identify] Identificação concluída"
        )

        res.status(200).json({
            resultados,
            aviso: temConfiancaBaixa
                ? "A confiança da identificação está baixa. Use os resultados como referência e revise os dados."
                : null,
        })
    })
)

module.exports = router