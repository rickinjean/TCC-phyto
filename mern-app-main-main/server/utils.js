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
    "latitude", "longitude",
]

// Precisão equivalente a Decimal(9,6): 6 casas decimais.
const CASAS_COORDENADA = 6

const COORDENADAS = {
    latitude: { min: -90, max: 90, rotulo: "Latitude" },
    longitude: { min: -180, max: 180, rotulo: "Longitude" },
}

// Aceita Number ou string (com ponto ou vírgula decimal), devolve Number
// arredondado a 6 casas, null quando vazio e NaN quando inválido.
function parseCoordenada(valor) {
    if (valor === undefined || valor === null) return null
    if (typeof valor === "number") {
        return Number.isFinite(valor) ? arredondarCoordenada(valor) : NaN
    }
    if (typeof valor !== "string") return NaN
    const texto = valor.trim().replace(",", ".")
    if (!texto) return null
    const numero = Number(texto)
    return Number.isFinite(numero) ? arredondarCoordenada(numero) : NaN
}

function arredondarCoordenada(numero) {
    const fator = 10 ** CASAS_COORDENADA
    const arredondado = Math.round(numero * fator) / fator
    return Object.is(arredondado, -0) ? 0 : arredondado
}

// Valida e normaliza o par latitude/longitude recebido do formulário.
// Regras: ambos opcionais, mas precisam ser informados juntos; faixa
// geográfica válida; até 6 casas decimais.
function normalizarCoordenadas(origem) {
    const body = origem || {}
    const latitude = parseCoordenada(body.latitude)
    const longitude = parseCoordenada(body.longitude)

    for (const [campo, valor] of [["latitude", latitude], ["longitude", longitude]]) {
        if (Number.isNaN(valor)) {
            return { ok: false, erro: `${COORDENADAS[campo].rotulo} inválida. Use um número decimal (ex.: -29.123456).` }
        }
    }

    const temLatitude = latitude !== null
    const temLongitude = longitude !== null
    if (temLatitude !== temLongitude) {
        return { ok: false, erro: "Informe latitude e longitude juntas ou deixe ambas em branco." }
    }

    for (const [campo, valor] of [["latitude", latitude], ["longitude", longitude]]) {
        if (valor === null) continue
        const { min, max, rotulo } = COORDENADAS[campo]
        if (valor < min || valor > max) {
            return { ok: false, erro: `${rotulo} deve estar entre ${min} e ${max}.` }
        }
    }

    return { ok: true, latitude, longitude }
}

// Monta o corpo { campo: req.body[campo] } a partir de CAMPOS_PLANTA.
// Coordenadas são sempre normalizadas: string vazia vira null e nunca é
// gravada como texto no MongoDB.
function plantaCorpo(req) {
    const corpo = {}
    for (const campo of CAMPOS_PLANTA) {
        corpo[campo] = req.body[campo]
    }
    const coords = normalizarCoordenadas(req.body)
    if (coords.ok) {
        corpo.latitude = coords.latitude
        corpo.longitude = coords.longitude
    } else {
        corpo.latitude = null
        corpo.longitude = null
    }
    return corpo
}

module.exports = {
    escapeRegex,
    asyncHandler,
    CAMPOS_PLANTA,
    plantaCorpo,
    parseCoordenada,
    normalizarCoordenadas,
}