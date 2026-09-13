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

// Fallback: quando a Pl@ntNet não devolveu a classe/filo/ordem, casa o nome
// científico no GBIF Species Match e usa a classificação completa do resultado.
async function casarTaxonomiaGBIF(nomeCientifico) {
    if (!nomeCientifico) return null
    try {
        const { data } = await axios.get("https://api.gbif.org/v1/species/match", {
            params: { name: nomeCientifico, strict: false },
            timeout: 10000,
            headers: { "User-Agent": "PhytografiaTCC (trabalho academico)" },
        })
        return {
            filo: data.phylum || null,
            classe: data.clazz || data.className || null,
            ordem: data.order || null,
            family: data.family || null,
        }
    } catch (err) {
        logger.warn({ nomeCientifico, err: err.message || "Erro" }, "[identify] Falha ao casar taxonomia GBIF")
        return null
    }
}

// Fallback: quando a Pl@ntNet não devolve nome comum, busca os nomes
// vernaculares do GBIF (por > espanhol > inglês).
async function buscarNomeVernacularGBIF(gbifId) {
    if (!gbifId) return ""
    try {
        const { data } = await axios.get(
            `https://api.gbif.org/v1/species/${encodeURIComponent(gbifId)}/vernacularNames`,
            { timeout: 10000, headers: { "User-Agent": "PhytografiaTCC (trabalho academico)" } }
        )
        const nomes = Array.isArray(data.results) ? data.results : []
        const langs = ["por", "spa", "eng"]
        for (const lang of langs) {
            const achado = nomes.find(n => n && n.language === lang && n.vernacularName && String(n.vernacularName).trim())
            if (achado) return String(achado.vernacularName).trim()
        }
        const qualquer = nomes.find(n => n && n.vernacularName && String(n.vernacularName).trim())
        return qualquer ? String(qualquer.vernacularName).trim() : ""
    } catch (err) {
        logger.warn({ gbifId, err: err.message || "Erro" }, "[identify] Falha ao consultar nomes comuns GBIF")
        return ""
    }
}

const ROTULOS_CAMPOS = {
    nomePopular: "Nome popular",
    scientificName: "Nome científico",
    family: "Família",
    genus: "Gênero",
    species: "Espécie",
    filo: "Filo",
    classe: "Classe",
    ordem: "Ordem",
}

function camposFaltantes(r) {
    return Object.keys(ROTULOS_CAMPOS).filter(k => !r[k] || !String(r[k]).trim()).map(k => ROTULOS_CAMPOS[k])
}

async function montarResultados(apiData, taxonomia) {
    const resultadosBrutos = Array.isArray(apiData.results) ? apiData.results : []
    const vistos = new Set()
    const rascunhos = []

    for (const r of resultadosBrutos) {
        const sp = r && r.species
        if (!sp) continue
        const nomeCientifico = sp.scientificNameWithoutAuthor || sp.scientificName || ""
        if (!nomeCientifico) continue

        const partes = nomeCientifico.split(/\s+/).filter(Boolean)
        const chave = partes.slice(0, 2).join(" ").toLowerCase()
        if (vistos.has(chave)) continue
        vistos.add(chave)

        rascunhos.push({
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
        if (rascunhos.length >= 3) break
    }

    resultados = await Promise.all(
        rascunhos.map(async r => {
            if (!r.nomePopular && r.gbifId) {
                r.nomePopular = await buscarNomeVernacularGBIF(r.gbifId)
            }
            r.faltantes = camposFaltantes(r)
            return r
        })
    )

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

        // Escolhe o melhor registro com gbif entre os top-3 para a taxonomia.
        const brutos = Array.isArray(apiData.results) ? apiData.results : []
        let gbifId = null
        for (const r of brutos.slice(0, 3)) {
            if (r && r.gbif && r.gbif.id) { gbifId = String(r.gbif.id); break }
        }
        let taxonomia = gbifId ? await buscarTaxonomiaGBIF(gbifId) : null

        // Se a taxonomia ficou incompleta, tenta casar pelo nome científico do top-1.
        const melhorNome = melhor && melhor.species
            ? (melhor.species.scientificNameWithoutAuthor || melhor.species.scientificName || "")
            : ""
        if ((!taxonomia || !taxonomia.classe || !taxonomia.filo || !taxonomia.ordem) && melhorNome) {
            const alternativa = await casarTaxonomiaGBIF(melhorNome)
            if (alternativa) {
                taxonomia = {
                    filo: (taxonomia && taxonomia.filo) || alternativa.filo || null,
                    classe: (taxonomia && taxonomia.classe) || alternativa.classe || null,
                    ordem: (taxonomia && taxonomia.ordem) || alternativa.ordem || null,
                    family: (taxonomia && taxonomia.family) || alternativa.family || null,
                }
            }
        }

        const resultados = await montarResultados(apiData, taxonomia)
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