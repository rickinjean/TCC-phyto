/*
 * Gera server/data/tdwg-paises.json: código TDWG nível 3 -> código ISO alpha-3.
 *
 * O GBIF entrega a distribuição da WCVP por regiões TDWG (ex.: "BZL" =
 * Brazil Southeast), não por país. Este script baixa a malha oficial do TDWG
 * e a malha de países do Natural Earth 50m (mais detalhada que a 110m usada
 * no site, para enxergar Andamã, Açores, Canárias etc.) e resolve cada região
 * assim: amostra pontos DENTRO da região TDWG, descobre em qual país cada
 * ponto cai e escolhe o país com mais amostras. Quando a região é formada por
 * ilhotas muito pequenas, aumenta a resolução da grade até achar terra.
 *
 * Um pequeno quadro manual cobre regiões sem terra no Natural Earth
 * (Galápagos, Kermadec, Tokelau...) e correções pontuais documentadas.
 *
 * Uso (uma vez, quando a malha ou os países mudarem):
 *   node scripts/gerar-tabela-tdwg.js
 *
 * Não é executado no build do Render; o JSON gerado é versionado.
 */
const fs = require("fs")
const path = require("path")

const URL_TDWG = "https://raw.githubusercontent.com/tdwg/wgsrpd/master/geojson/level3.geojson"
const URL_NE50 = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
const RAIZ = path.join(__dirname, "..")
const DESTINO = path.join(RAIZ, "server/data/tdwg-paises.json")
const WHITELIST = path.join(RAIZ, "server/data/paises-iso.json")

const RESOLUCOES = [20, 40, 80, 160]

// Regiões resolvidas à mão: ilhas muito pequenas para a amostragem, ou
// correções de limites disputados. O valor é o país soberano do território.
// Referência: WGSRPD (Brummitt 2001) e divisões administrativas atuais.
const MANUAL = {
    GAL: "ECU", // Galápagos
    KER: "NZL", // Kermadec Islands
    TOK: "NZL", // Tokelau (território da Nova Zelândia)
    ALD: "SYC", // Aldabra (Seicheles)
    ASP: "ATF", // Amsterdam-St. Paul (Terras Austrais Francesas)
    WAK: "USA", // Wake Island (território dos EUA)
    CTM: "NZL", // Chatham Islands (Nova Zelândia)
    MXI: "MEX", // Ilhas do Pacífico mexicano
    HBI: "USA", // Howland-Baker Islands (territórios dos EUA)
    NNS: "JPN", // Nansei-shoto (Ryukyu, Japão)
    CRZ: "FRA", // Crozet (Terras Austrais Francesas)
    MCI: "FRA", // Ilhas do Canal de Moçambique (ilhas esparsas francesas)
    MCS: "JPN", // Marcus Island (Minamitorishima, Japão)
    SCZ: "SLB", // Santa Cruz Islands (Ilhas Salomão)
    TDC: "SHN", // Tristan da Cunha (Santa Helena)
    LIN: "KIR", // Line Islands (Kiribati)
    PHX: "KIR", // Phoenix Islands (Kiribati)
    TUB: "PYF", // Tubuai Islands (Polinésia Francesa)
    ROD: "MUS", // Rodrigues (Maurício)
    MDV: "MDV", // Maldivas
    DSV: "CHL", // Desventurados (Chile)
    KZN: "JPN", // Kazan-retto (Japão)
    BOU: "NOR", // Bouvet (Noruega)
    SEL: "PRT", // Selvagens (Portugal)
    KRY: "UKR", // Crimeia (reconhecimento internacional; NE atribui à Rússia)
    PAL: "PSE", // Palestina (a amostragem da Cisjordânia/Faixa de Gaza é instável)
    LES: "LSO", // Lesoto (enclave; a amostragem da borda caía na África do Sul)
    KOR: "KOR", // Coreia (península; o código TDWG coincide com o país)
    FRG: "FRA", // Guiana Francesa (departamento ultramarino; sem ISO próprio na lista)
}

// Regiões que não correspondem a um país da lista: Antártida, ilhas do
// Pacífico central sem soberania única (Clipperton/Cocos/Malpelo) e mares
// com ilhotas disputadas (Mar do Sul da China, Sudoeste do Caribe).
const IGNORAR = new Set(["ANT", "CPI", "SCS", "SWC"])

function bboxDoAnel(anel) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of anel) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
    }
    return [minX, minY, maxX, maxY]
}

function prepararGeometria(geometria) {
    const poligonos = geometria.type === "Polygon"
        ? [geometria.coordinates]
        : geometria.coordinates
    return poligonos.map(anel => ({
        anel: anel[0],
        bbox: bboxDoAnel(anel[0]),
    }))
}

function dentroDoAnel(ponto, anel) {
    const [x, y] = ponto
    let dentro = false
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const [xi, yi] = anel[i]
        const [xj, yj] = anel[j]
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro
    }
    return dentro
}

// Contém o ponto? Testa também ±360° para polígonos que cruzam o antimeridiano.
function contem(preparada, lng, lat) {
    for (const offset of [0, 360, -360]) {
        const x = lng + offset
        for (const poligono of preparada) {
            const b = poligono.bbox
            if (x < b[0] || x > b[2] || lat < b[1] || lat > b[3]) continue
            if (dentroDoAnel([x, lat], poligono.anel)) return true
        }
    }
    return false
}

// Bounding box em faixa contínua de longitude: quando a geometria cruza o
// antimeridiano, desloca as longitudes negativas para +360.
function bboxDaGeometria(geometria) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let minXBruto = Infinity, maxXBruto = -Infinity
    const visitar = (coords) => {
        if (typeof coords[0] === "number") {
            const [x, y] = coords
            if (x < minXBruto) minXBruto = x
            if (x > maxXBruto) maxXBruto = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
            return
        }
        coords.forEach(visitar)
    }
    visitar(geometria.coordinates)

    if (maxXBruto - minXBruto > 180) {
        const visitarDeslocado = (coords) => {
            if (typeof coords[0] === "number") {
                const x = coords[0] < 0 ? coords[0] + 360 : coords[0]
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                return
            }
            coords.forEach(visitarDeslocado)
        }
        visitarDeslocado(geometria.coordinates)
    } else {
        minX = minXBruto
        maxX = maxXBruto
    }
    return [minX, minY, maxX, maxY]
}

function deslocar(bbox, delta) {
    return [bbox[0] + delta, bbox[1], bbox[2] + delta, bbox[3]]
}

function bboxCruza(a, b) {
    return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

// Compara caixas mesmo quando uma delas foi calculada no fuso +360.
function bboxCruzaEmQualquerFuso(a, b) {
    return bboxCruza(a, b) || bboxCruza(deslocar(a, 360), b) || bboxCruza(deslocar(a, -360), b)
}

// Varre a caixa em grade n x n; aoAchar recebe os pontos que caem na geometria.
function amostrar(preparada, bbox, n, aoAchar) {
    const [minX, minY, maxX, maxY] = bbox
    const passoX = (maxX - minX) / n
    const passoY = (maxY - minY) / n
    let validos = 0
    for (let ix = 0; ix < n; ix++) {
        const lng = minX + (ix + 0.5) * passoX
        for (let iy = 0; iy < n; iy++) {
            const lat = minY + (iy + 0.5) * passoY
            if (!contem(preparada, lng, lat)) continue
            validos++
            if (aoAchar) aoAchar(lng, lat)
        }
    }
    return validos
}

function codigoDaFeature(p) {
    return [p.ISO_A3, p.ISO_A3_EH, p.ADM0_A3]
        .find(v => typeof v === "string" && /^[A-Z]{3}$/.test(v) && v !== "XXX" && v !== "-99")
}

function paisesDoNaturalEarth(dados) {
    const porCodigo = new Map()
    for (const f of dados.features) {
        const codigo = codigoDaFeature(f.properties)
        if (!codigo || codigo === "ATA") continue
        const partes = f.geometry.type === "Polygon"
            ? [f.geometry.coordinates]
            : f.geometry.coordinates
        if (!porCodigo.has(codigo)) porCodigo.set(codigo, [])
        porCodigo.get(codigo).push(...partes)
    }
    return [...porCodigo].map(([codigo, poligonos]) => {
        const geometria = { type: "MultiPolygon", coordinates: poligonos }
        return {
            codigo,
            bbox: bboxDaGeometria(geometria),
            preparada: prepararGeometria(geometria),
        }
    })
}

function vencedor(contagem) {
    let melhor = null
    let melhorQtd = 0
    for (const [codigo, qtd] of contagem) {
        if (qtd > melhorQtd) {
            melhor = codigo
            melhorQtd = qtd
        }
    }
    return melhor
}

function baixar(url) {
    return fetch(url).then(r => {
        if (!r.ok) throw new Error(`download falhou (${r.status}): ${url}`)
        return r.json()
    })
}

async function main() {
    const inicio = Date.now()
    const decorrido = () => `${Math.round((Date.now() - inicio) / 1000)}s`

    const whitelist = new Set(JSON.parse(fs.readFileSync(WHITELIST, "utf8")))
    const [malha, ne50] = await Promise.all([baixar(URL_TDWG), baixar(URL_NE50)])
    console.log(`[${decorrido()}] downloads prontos`)

    const regioes = malha.features
        .filter(f => f.properties && f.properties.LEVEL3_COD)
        .map(f => ({
            codigo: f.properties.LEVEL3_COD,
            nome: f.properties.LEVEL3_NAM || f.properties.LEVEL3_NAME || "",
            bbox: bboxDaGeometria(f.geometry),
            preparada: prepararGeometria(f.geometry),
        }))

    const paises = paisesDoNaturalEarth(ne50)
    const paisesPorCodigo = new Map(paises.map(p => [p.codigo, p]))

    const tabela = {}
    const semTerra = []
    const tentativas = new Map()

    for (const regiao of regioes) {
        if (IGNORAR.has(regiao.codigo) || MANUAL[regiao.codigo]) continue
        const candidatos = paises.filter(pais => bboxCruzaEmQualquerFuso(pais.bbox, regiao.bbox))
        if (candidatos.length === 0) {
            semTerra.push(regiao.codigo)
            continue
        }

        let achou = null
        for (const n of RESOLUCOES) {
            const contagem = new Map()
            amostrar(regiao.preparada, regiao.bbox, n, (lng, lat) => {
                for (const pais of candidatos) {
                    if (!contem(pais.preparada, lng, lat)) continue
                    contagem.set(pais.codigo, (contagem.get(pais.codigo) || 0) + 1)
                    break
                }
            })
            achou = vencedor(contagem)
            if (achou) {
                tentativas.set(regiao.codigo, n)
                break
            }
        }
        if (achou) tabela[regiao.codigo] = achou
        else semTerra.push(regiao.codigo)
    }
    console.log(`[${decorrido()}] regiões resolvidas pela amostragem`)

    // Correções manuais.
    const porManual = []
    for (const [codigo, pais] of Object.entries(MANUAL)) {
        if (tabela[codigo] === pais) continue
        tabela[codigo] = pais
        porManual.push(`${codigo}->${pais}`)
    }

    // Só valores dentro da whitelist do servidor podem ser gravados.
    const foraDaWhitelist = Object.entries(tabela)
        .filter(([, pais]) => !whitelist.has(pais))
        .map(([codigo, pais]) => `${codigo}->${pais}`)
    for (const item of foraDaWhitelist) delete tabela[item.split("->")[0]]

    // Validação: a região precisa ter terra dentro do país atribuído, exceto
    // nas correções manuais (que existem justamente para casos sem terra).
    const falhas = []
    for (const regiao of regioes) {
        const codigoPais = tabela[regiao.codigo]
        if (!codigoPais || MANUAL[regiao.codigo]) continue
        const alvo = paisesPorCodigo.get(codigoPais)
        if (!alvo) continue
        let acertos = 0
        amostrar(regiao.preparada, regiao.bbox, 24, (lng, lat) => {
            if (contem(alvo.preparada, lng, lat)) acertos++
        })
        if (acertos === 0) falhas.push(`${regiao.codigo}(${regiao.nome})->${codigoPais}`)
    }

    const ordenada = {}
    for (const codigo of Object.keys(tabela).sort()) ordenada[codigo] = tabela[codigo]

    fs.mkdirSync(path.dirname(DESTINO), { recursive: true })
    fs.writeFileSync(DESTINO, JSON.stringify(ordenada))

    const semPais = regioes.filter(regiao => !ordenada[regiao.codigo]).map(r => r.codigo)
    const resolvidasAcimaDe20 = [...tentativas].filter(([, n]) => n > 20)
    const conferir = ["BZL", "BZE", "BZS", "CHC", "ABT", "BIS", "AND", "CVI", "CRL", "GAL", "FIJ", "MDV", "TON", "TUV", "REU", "BAL", "AZO", "NFK", "SOC", "TOK", "EAS", "MDR", "OGA", "KUR", "NCB", "ALA", "HAW", "VER", "KRY", "MRN", "FRA", "RUW"]

    console.log("regiões na malha:", regioes.length)
    console.log("resolvidas em resolução maior:", resolvidasAcimaDe20.length,
        resolvidasAcimaDe20.map(([c, n]) => `${c}@${n}`).join(" "))
    console.log("correções manuais aplicadas:", porManual.length, porManual.join(" "))
    console.log("total mapeado:", Object.keys(ordenada).length)
    console.log("fora da whitelist (descartadas):", foraDaWhitelist.length, foraDaWhitelist.join(" "))
    console.log("sem país:", semPais.length, semPais.join(","))
    console.log("FALHAS DE VALIDAÇÃO:", falhas.length, falhas.join(" "))
    console.log("conferência:", conferir.map(c => `${c}->${ordenada[c] || "?"}`).join(" "))
    console.log("KB:", Math.round(fs.statSync(DESTINO).size / 1024))
    console.log(`[${decorrido()}] fim`)
}

main().catch(erro => { console.error(erro); process.exit(1) })
