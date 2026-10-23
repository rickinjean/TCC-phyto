import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import {
    OSM_TILE_URL,
    OSM_ATTRIBUTION,
    OSM_MAX_ZOOM,
    OSM_REFERRER_POLICY,
    criarIconePin,
    coordenadasValidas,
    parseCoordenada,
} from "../geo"

const CENTRO_BRASIL = [-15.78, -47.93]
const ZOOM_BRASIL = 4
const ZOOM_DETALHE = 15

// Cria o marcador na primeira vez e apenas o reposiciona nas seguintes.
function posicionarMarcador(map, markerRef, latlng, onChangeRef) {
    if (markerRef.current) {
        markerRef.current.setLatLng(latlng)
        return
    }
    const marker = L.marker(latlng, {
        icon: criarIconePin(),
        draggable: true,
        keyboard: true,
        title: "Arraste para ajustar o ponto da coleta",
        alt: "Marcador do local da coleta",
    }).addTo(map)
    marker.on("dragend", () => {
        const ponto = marker.getLatLng()
        onChangeRef.current?.({ latitude: ponto.lat, longitude: ponto.lng })
    })
    markerRef.current = marker
}

export default function MapPicker({ latitude, longitude, onChange, height }) {
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const markerRef = useRef(null)
    const onChangeRef = useRef(onChange)
    const [geoStatus, setGeoStatus] = useState("")

    onChangeRef.current = onChange

    // Inicializa o mapa uma única vez.
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        const lat = parseCoordenada(latitude)
        const lng = parseCoordenada(longitude)
        const temCoordenadas = coordenadasValidas(lat, lng)

        const map = L.map(containerRef.current, {
            center: temCoordenadas ? [lat, lng] : CENTRO_BRASIL,
            zoom: temCoordenadas ? ZOOM_DETALHE : ZOOM_BRASIL,
            scrollWheelZoom: false,
            zoomControl: true,
        })

        L.tileLayer(OSM_TILE_URL, {
            maxZoom: OSM_MAX_ZOOM,
            attribution: OSM_ATTRIBUTION,
            referrerPolicy: OSM_REFERRER_POLICY,
        }).addTo(map)

        if (temCoordenadas) {
            posicionarMarcador(map, markerRef, [lat, lng], onChangeRef)
        }

        map.on("click", (evento) => {
            posicionarMarcador(map, markerRef, evento.latlng, onChangeRef)
            onChangeRef.current?.({
                latitude: evento.latlng.lat,
                longitude: evento.latlng.lng,
            })
        })

        mapRef.current = map
        // Garante o cálculo correto do tamanho após o container ser exibido
        // (a etapa do wizard é montada dinamicamente).
        const timer = setTimeout(() => map.invalidateSize(), 0)

        return () => {
            clearTimeout(timer)
            map.remove()
            mapRef.current = null
            markerRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sincroniza alterações externas (digitação manual, geolocalização, limpar).
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        const lat = parseCoordenada(latitude)
        const lng = parseCoordenada(longitude)

        if (!coordenadasValidas(lat, lng)) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current)
                markerRef.current = null
            }
            return
        }

        const alvo = L.latLng(lat, lng)
        const precisaCentralizar = !markerRef.current || map.getCenter().distanceTo(alvo) > 1000
        posicionarMarcador(map, markerRef, alvo, onChangeRef)
        if (precisaCentralizar) {
            map.setView(alvo, Math.max(map.getZoom(), ZOOM_DETALHE))
        }
    }, [latitude, longitude])

    function usarMinhaLocalizacao() {
        if (!navigator.geolocation) {
            setGeoStatus("Seu navegador não oferece suporte a geolocalização.")
            return
        }
        setGeoStatus("Obtendo localização…")
        navigator.geolocation.getCurrentPosition(
            (posicao) => {
                const { latitude: lat, longitude: lng, accuracy } = posicao.coords
                onChangeRef.current?.({ latitude: lat, longitude: lng })
                setGeoStatus(`Localização obtida (precisão de ~${Math.round(accuracy)} m).`)
            },
            (erro) => {
                const mensagem = erro.code === erro.PERMISSION_DENIED
                    ? "Permissão de localização negada. Informe as coordenadas manualmente."
                    : "Não foi possível obter sua localização. Tente novamente."
                setGeoStatus(mensagem)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    }

    return (
        <div className="phyto-map-picker">
            <div className="phyto-map-toolbar">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={usarMinhaLocalizacao}
                >
                    <span aria-hidden="true">📍</span> Usar minha localização
                </button>
                {geoStatus && (
                    <span className="phyto-map-toolbar__status" role="status">
                        {geoStatus}
                    </span>
                )}
            </div>
            <div
                ref={containerRef}
                className="phyto-map phyto-map--picker"
                style={height ? { height } : undefined}
                aria-label="Mapa para selecionar as coordenadas da coleta"
            />
            <p className="phyto-map-hint">
                Clique no mapa ou arraste o marcador para ajustar o ponto exato da coleta.
            </p>
        </div>
    )
}
