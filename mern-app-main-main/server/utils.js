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
]

// Monta o corpo { campo: req.body[campo] } a partir de CAMPOS_PLANTA
function plantaCorpo(req) {
    const corpo = {}
    for (const campo of CAMPOS_PLANTA) {
        corpo[campo] = req.body[campo]
    }
    return corpo
}

module.exports = { escapeRegex, asyncHandler, CAMPOS_PLANTA, plantaCorpo }