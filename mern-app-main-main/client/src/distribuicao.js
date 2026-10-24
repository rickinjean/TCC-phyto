import PAISES from "./data/paises"

// Índice código ISO alpha-3 -> registro do país.
const POR_CODIGO = new Map(PAISES.map(pais => [pais.codigo, pais]))

export const STATUS_DISTRIBUICAO = {
    nativa: "Nativa",
    cultivada: "Cultivada / introduzida",
}

export const SEM_REGISTRO = "Sem registro"

// Aceita qualquer entrada e devolve uma lista limpa de códigos alpha-3,
// sem repetição e em maiúsculas.
export function normalizarCodigos(valor) {
    if (!Array.isArray(valor)) return []
    const vistos = new Set()
    const saida = []
    for (const item of valor) {
        if (typeof item !== "string") continue
        const codigo = item.trim().toUpperCase()
        if (!/^[A-Z]{3}$/.test(codigo) || vistos.has(codigo)) continue
        vistos.add(codigo)
        saida.push(codigo)
    }
    return saida
}

// Lê o campo `distribuicao` da planta com valores seguros para a interface.
export function distribuicaoDaPlanta(planta) {
    const bruto = planta && typeof planta === "object" ? planta.distribuicao : null
    if (!bruto || typeof bruto !== "object") {
        return { nativa: [], cultivada: [], fonte: "" }
    }
    return {
        nativa: normalizarCodigos(bruto.nativa),
        cultivada: normalizarCodigos(bruto.cultivada),
        fonte: typeof bruto.fonte === "string" ? bruto.fonte.trim() : "",
    }
}

export function nomeDoPais(codigo) {
    return POR_CODIGO.get(codigo)?.nome || codigo
}

export function paisPorCodigo(codigo) {
    return POR_CODIGO.get(codigo) || null
}

export function nomesDe(codigos) {
    return normalizarCodigos(codigos).map(nomeDoPais)
}

function semAcento(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
}

// Busca por nome (com ou sem acento) para selecionar países pequenos que
// quase não têm área clicável no mapa.
export function buscarPaises(termo, limite = 8) {
    const alvo = semAcento(termo)
    if (alvo.length < 2) return []
    return PAISES
        .filter(pais => semAcento(pais.nome).includes(alvo))
        .slice(0, limite)
}

export function paisesComMapa() {
    return PAISES.filter(pais => pais.temMapa)
}
