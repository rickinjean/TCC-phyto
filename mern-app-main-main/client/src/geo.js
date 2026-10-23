import L from "leaflet"

// Camada base do OpenStreetMap (sem chave de API). A atribuição é obrigatória
// pelos termos de uso: https://www.openstreetmap.org/copyright
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
export const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
export const OSM_MAX_ZOOM = 19

const CASAS = 6

function arredondar(numero) {
    const fator = 10 ** CASAS
    const valor = Math.round(numero * fator) / fator
    return Object.is(valor, -0) ? 0 : valor
}

// Aceita Number ou texto com ponto/vírgula decimal.
// Retorna null para vazio e NaN para valor inválido.
export function parseCoordenada(valor) {
    if (valor === undefined || valor === null) return null
    if (typeof valor === "number") {
        return Number.isFinite(valor) ? arredondar(valor) : NaN
    }
    if (typeof valor !== "string") return NaN
    const texto = valor.trim().replace(",", ".")
    if (!texto) return null
    const numero = Number(texto)
    return Number.isFinite(numero) ? arredondar(numero) : NaN
}

export function coordenadasValidas(latitude, longitude) {
    return Number.isFinite(latitude) && Number.isFinite(longitude) &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
}

// Texto para os inputs do formulário (6 casas, ponto decimal).
export function coordenadaParaInput(valor) {
    const numero = parseCoordenada(valor)
    if (numero === null || Number.isNaN(numero)) return ""
    return numero.toFixed(CASAS)
}

// Exibição amigável na ficha pública: "29.123456° S".
export function formatarCoordenada(valor, tipo) {
    const numero = parseCoordenada(valor)
    if (numero === null || Number.isNaN(numero)) return "—"
    const absoluto = Math.abs(numero).toFixed(CASAS)
    let direcao = ""
    if (tipo === "latitude") direcao = numero >= 0 ? "N" : "S"
    else if (tipo === "longitude") direcao = numero >= 0 ? "E" : "W"
    return direcao ? `${absoluto}° ${direcao}` : `${numero.toFixed(CASAS)}°`
}

export function linkOpenStreetMap(latitude, longitude) {
    const lat = parseCoordenada(latitude)
    const lng = parseCoordenada(longitude)
    if (!coordenadasValidas(lat, lng)) return null
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
}

// Validação compartilhada pelo formulário (aviso em tempo real e envio).
export function validarParCoordenadas(latitude, longitude) {
    const lat = parseCoordenada(latitude)
    const lng = parseCoordenada(longitude)

    if (Number.isNaN(lat)) {
        return { ok: false, erro: "Latitude inválida. Use um número decimal (ex.: -29.123456)." }
    }
    if (Number.isNaN(lng)) {
        return { ok: false, erro: "Longitude inválida. Use um número decimal (ex.: -49.123456)." }
    }

    const temLatitude = lat !== null
    const temLongitude = lng !== null
    if (temLatitude !== temLongitude) {
        return { ok: false, erro: "Informe latitude e longitude juntas ou deixe ambas em branco." }
    }

    if (temLatitude && (lat < -90 || lat > 90)) {
        return { ok: false, erro: "Latitude deve estar entre -90 e 90." }
    }
    if (temLongitude && (lng < -180 || lng > 180)) {
        return { ok: false, erro: "Longitude deve estar entre -180 e 180." }
    }

    return { ok: true, latitude: lat, longitude: lng }
}

// Marcador em SVG inline: evita o problema clássico de ícone quebrado do
// Leaflet em bundles do CRA e não depende de nenhuma imagem externa.
export function criarIconePin(cor = "#d62828") {
    const html = `
        <svg viewBox="0 0 32 44" width="32" height="44" aria-hidden="true" focusable="false">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 12.2 16 28 16 28s16-15.8 16-28C32 7.16 24.84 0 16 0z"
                fill="${cor}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="15" r="5.5" fill="#ffffff"/>
        </svg>`
    return L.divIcon({
        className: "phyto-map-pin",
        html,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -38],
    })
}
