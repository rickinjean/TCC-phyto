import { useEffect, useRef } from "react"
import L from "leaflet"
import {
    OSM_TILE_URL,
    OSM_ATTRIBUTION,
    OSM_MAX_ZOOM,
    criarIconePin,
    coordenadasValidas,
    parseCoordenada,
} from "../geo"

const ZOOM_DETALHE = 15

// Popup construído com nós de DOM (textContent) em vez de string HTML:
// nomes populares são dados editáveis e não devem ser interpretados como HTML.
function criarPopup(nomePopular) {
    const container = document.createElement("div")
    container.className = "phyto-map-popup"
    const titulo = document.createElement("strong")
    titulo.textContent = nomePopular || "Coleta botânica"
    container.appendChild(titulo)
    return container
}

export default function PlantLocationMap({ latitude, longitude, nomePopular, height }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const lat = parseCoordenada(latitude)
        const lng = parseCoordenada(longitude)
        if (!containerRef.current || !coordenadasValidas(lat, lng)) return

        const map = L.map(containerRef.current, {
            center: [lat, lng],
            zoom: ZOOM_DETALHE,
            scrollWheelZoom: false,
            zoomControl: true,
        })

        L.tileLayer(OSM_TILE_URL, {
            maxZoom: OSM_MAX_ZOOM,
            attribution: OSM_ATTRIBUTION,
        }).addTo(map)

        const marker = L.marker([lat, lng], {
            icon: criarIconePin(),
            title: nomePopular || "Local da coleta",
            alt: `Local da coleta de ${nomePopular || "planta"}`,
            keyboard: true,
        }).addTo(map)

        marker.bindPopup(criarPopup(nomePopular), {
            closeButton: true,
            autoPan: true,
            maxWidth: 260,
        })

        const timer = setTimeout(() => map.invalidateSize(), 0)

        // Recalcula o tamanho ao girar o celular ou redimensionar a janela.
        let observador = null
        if (typeof ResizeObserver !== "undefined") {
            observador = new ResizeObserver(() => map.invalidateSize())
            observador.observe(containerRef.current)
        }

        return () => {
            clearTimeout(timer)
            if (observador) observador.disconnect()
            map.remove()
        }
    }, [latitude, longitude, nomePopular])

    const lat = parseCoordenada(latitude)
    const lng = parseCoordenada(longitude)
    if (!coordenadasValidas(lat, lng)) return null

    return (
        <div
            ref={containerRef}
            className="phyto-map phyto-map--public"
            style={height ? { height } : undefined}
            aria-label={`Mapa de ocorrência de ${nomePopular || "planta"}`}
        />
    )
}
