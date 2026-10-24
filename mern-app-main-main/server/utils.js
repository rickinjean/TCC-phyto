function escapeRegex(str) {
    return String(str == null ? "" : str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Envolve handlers assíncronos e responde 500 em caso de erro,
// evitando repetir try/catch em toda rota.
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(error => {
            res.status(500).json({ message: (error && error.message) || "Erro no servidor" })
        })
    }
}

// Campos da ficha da planta — mesma ordem no criar e no editar
const CAMPOS_PLANTA = [
    "name", "scientificName", "description", "simpleDescription",
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
    "Filo", "Classe", "Ordem", "Family", "Genero", "Especie",
    "height", "flowercolor", "foliage", "flowering",
    "light", "water", "size", "soil",
    "watering", "fertilizing", "pruning", "pests",
    "manha", "amount", "frequency", "NPK", "season", "tools", "prevention", "monitoring",
    "planting", "exhibition", "maintenance",
    "station", "spacing", "iluminosity", "protection", "idealTemperature", "tolerance",
    "distribuicao",
]

// Whitelist de países (ISO alpha-3) aceitos no campo distribuicao.
const PAISES_ISO = new Set(require("./data/paises-iso.json"))
const LIMITE_PAISES = PAISES_ISO.size
const TAMANHO_MAXIMO_FONTE = 160

function listaDePaises(valor) {
    if (!Array.isArray(valor)) return []
    const vistos = new Set()
    for (const item of valor) {
        if (typeof item !== "string") continue
        const codigo = item.trim().toUpperCase()
        if (!/^[A-Z]{3}$/.test(codigo) || !PAISES_ISO.has(codigo)) continue
        vistos.add(codigo)
    }
    return [...vistos].slice(0, LIMITE_PAISES)
}

// Normaliza a distribuição geográfica recebida do formulário.
// Regras: só códigos ISO conhecidos, sem repetição, sem sobreposição entre
// nativa e cultivada (nativa vence) e fonte com no máximo 160 caracteres.
function normalizarDistribuicao(valor) {
    let bruto = valor
    if (typeof bruto === "string") {
        try {
            bruto = JSON.parse(bruto)
        } catch {
            bruto = null
        }
    }
    if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
        return { nativa: [], cultivada: [], fonte: "" }
    }

    const nativa = listaDePaises(bruto.nativa)
    const conjuntoNativa = new Set(nativa)
    const cultivada = listaDePaises(bruto.cultivada).filter(codigo => !conjuntoNativa.has(codigo))
    const fonte = typeof bruto.fonte === "string"
        ? bruto.fonte.trim().slice(0, TAMANHO_MAXIMO_FONTE)
        : ""

    return { nativa, cultivada, fonte }
}

// Monta o corpo { campo: req.body[campo] } a partir de CAMPOS_PLANTA.
// A distribuição é sempre normalizada antes de ir para o MongoDB.
function plantaCorpo(req) {
    const corpo = {}
    for (const campo of CAMPOS_PLANTA) {
        if (campo === "distribuicao") continue
        corpo[campo] = req.body[campo]
    }
    corpo.distribuicao = normalizarDistribuicao(req.body.distribuicao)
    return corpo
}

module.exports = {
    escapeRegex,
    asyncHandler,
    CAMPOS_PLANTA,
    plantaCorpo,
    normalizarDistribuicao,
}