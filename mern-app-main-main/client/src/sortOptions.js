// Ordem manual (não alfabética) para selects que definem níveis ou
// seguem uma lógica própria. Itens não listados vão para o fim da lista.
const ORDEM_MANUAL = {
    toxicity: ["Não é tóxica", "Baixa toxicidade", "Moderada toxicidade", "Alta toxicidade"],
    dificulty: ["Baixa", "Média", "Alta"],
    water: ["Baixa", "Baixa/Moderada", "Moderada", "Alta"],
    size: ["Pequeno", "Médio", "Grande"],
    manha: ["Início da manhã", "Meio da manhã", "Fim da manhã", "Início da tarde", "Fim da tarde"],
    prevention: ["Baixo", "Médio", "Alto"],
    monitoring: ["Baixo", "Médio", "Alto"],
    tolerance: ["Baixa", "Baixa/Moderada", "Moderada", "Alta", "Altíssima"],
    flowercolor: ["Branco", "Branco puro", "Branco/Rosado", "Amarelo", "Laranja", "Vermelho", "Rosa", "Roxo", "Lilás", "Azul", "Verde"]
}

// Chaves com a mesma ordem lógica de estações
const ORDEM_ESTACOES = ["Primavera", "Primavera/Verão", "Verão", "Verão/Outono", "Outono", "Outono/Inverno", "Inverno", "Inverno/Primavera"]

function indiceEstacao(nome) {
    const idx = ORDEM_ESTACOES.indexOf(nome)
    return idx === -1 ? null : idx
}

function ordemLight(nome) {
    const baixo = ["Penumbra", "Meia-sombra"]
    const medio = ["Sol pleno a meia-sombra"]
    const alto = ["Sol pleno"]
    if (baixo.includes(nome)) return 0
    if (medio.includes(nome)) return 1
    if (alto.includes(nome) || nome.startsWith("Meia-sombra")) return 2
    return null
}

// Extrai o primeiro número de um texto (ex.: "5 a 10 litros" -> 5; "40 a 60 mm" -> 40)
function primeiroNumero(texto) {
    const m = String(texto || "").match(/(\d+)/)
    return m ? parseInt(m[1], 10) : null
}

function chaveOrdem(campo) {
    switch (campo) {
        case "flowering":
        case "season":
        case "station":
            return "estacao"
        case "light":
            return "light"
        case "amount":
        case "spacing":
        case "iluminosity":
            return "numero"
        case "frequency":
            return "frequencia"
        default:
            return null
    }
}

export default function sortPorNome(lista, campo) {
    const arr = lista.slice()

    // Orders manual explícita (níveis e cores)
    const manual = ORDEM_MANUAL[campo]
    if (manual) {
        return arr.sort((a, b) => {
            const ia = manual.indexOf(a.name)
            const ib = manual.indexOf(b.name)
            if (ia === -1 && ib === -1) return 0
            if (ia === -1) return 1
            if (ib === -1) return -1
            return ia - ib
        })
    }

    const tipo = chaveOrdem(campo)

    // Época de floração / estação: ordem cronológica das estações
    if (tipo === "estacao") {
        return arr.sort((a, b) => {
            const ia = indiceEstacao(a.name)
            const ib = indiceEstacao(b.name)
            if (ia === null && ib === null) return 0
            if (ia === null) return 1
            if (ib === null) return -1
            return ia - ib
        })
    }

    // Luz: menor para maior intensidade
    if (tipo === "light") {
        return arr.sort((a, b) => {
            const ia = ordemLight(a.name)
            const ib = ordemLight(b.name)
            if (ia === null && ib === null) return 0
            if (ia === null) return 1
            if (ib === null) return -1
            return ia - ib
        })
    }

    // Números: menor para maior (quantidade, espaçamento, horas de sol)
    if (tipo === "numero") {
        return arr.sort((a, b) => {
            const na = primeiroNumero(a.name)
            const nb = primeiroNumero(b.name)
            if (na === null && nb === null) return 0
            if (na === null) return 1
            if (nb === null) return -1
            return na - nb
        })
    }

    // Frequência: mais frequente primeiro (menor número de dias primeiro)
    if (tipo === "frequencia") {
        return arr.sort((a, b) => {
            const na = primeiroNumero(a.name)
            const nb = primeiroNumero(b.name)
            if (na === null && nb === null) return 0
            if (na === null) return 1
            if (nb === null) return -1
            return na - nb
        })
    }

    // Default: ordem alfabética em pt-BR
    return arr.sort((a, b) =>
        a.name.localeCompare(b.name, "pt", { sensitivity: "base", numeric: true })
    )
}
