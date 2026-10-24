import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import {
    ZOOM_MAXIMO_MAPA,
    adicionarCamadasBase,
    criarIconePin,
    coordenadasValidas,
    parseCoordenada,
} from "../geo"

const CENTRO_BRASIL = [-15.78, -47.93]
const ZOOM_BRASIL = 4
const ZOOM_DETALHE = 15

// Acima deste valor a posição é considerada imprecisa: no desktop ela costuma
// vir do IP (erro de quilômetros), não do GPS/Wi-Fi.
const PRECISAO_MINIMA_CONFIAVEL = 1000

const MENSAGENS_ERRO = {
    PERMISSION_DENIED:
        "Permissão de localização negada. Libere o acesso nas configurações do navegador ou informe as coordenadas manualmente.",
    POSITION_UNAVAILABLE:
        "Não foi possível determinar sua posição. Verifique se os serviços de localização do sistema estão ativos.",
    TIMEOUT:
        "Tempo esgotado ao obter a localização. Tente novamente ou informe as coordenadas manualmente.",
}

// Abrir no nível de rua quando a posição tem quilômetros de erro passa uma
// falsa sensação de exatidão. O zoom acompanha a precisão informada.
function zoomParaPrecisao(precisao) {
    if (!Number.isFinite(precisao)) return ZOOM_DETALHE
    if (precisao <= 30) return 17
    if (precisao <= 60) return 16
    if (precisao <= 150) return 15
    if (precisao <= 400) return 14
    if (precisao <= 1000) return 13
    if (precisao <= 3000) return 11
    if (precisao <= 10000) return 9
    return 7
}

function descreverPrecisao(precisao) {
    if (!Number.isFinite(precisao)) {
        return { texto: "Localização obtida.", tipo: "ok" }
    }
    if (precisao >= PRECISAO_MINIMA_CONFIAVEL) {
        const km = (precisao / 1000).toFixed(1).replace(".", ",")
        return {
            texto: `Localização aproximada (~${km} km), provavelmente por IP. Ajuste o marcador no mapa ou use o celular em campo.`,
            tipo: "aviso",
        }
    }
    return {
        texto: `Localização obtida (precisão de ~${Math.round(precisao)} m).`,
        tipo: "ok",
    }
}

function obterPosicao(opcoes) {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opcoes)
    })
}

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
    const accuracyCircleRef = useRef(null)
    const onChangeRef = useRef(onChange)
    // Precisão vinda da geolocalização, consumida pelo efeito de sincronização.
    const precisaoPendenteRef = useRef(null)
    const forcarCentralizacaoRef = useRef(false)
    const zoomAlvoRef = useRef(null)
    const [geoStatus, setGeoStatus] = useState({ texto: "", tipo: "" })

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
            maxZoom: ZOOM_MAXIMO_MAPA,
            scrollWheelZoom: false,
            zoomControl: true,
        })

        adicionarCamadasBase(map)

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
            accuracyCircleRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sincroniza alterações externas (digitação manual, geolocalização, limpar).
    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        const lat = parseCoordenada(latitude)
        const lng = parseCoordenada(longitude)

        // A precisão vale apenas para o ponto que acabou de ser obtido. Se a
        // alteração veio de digitação manual, o círculo de incerteza sai.
        const precisao = precisaoPendenteRef.current
        precisaoPendenteRef.current = null

        if (accuracyCircleRef.current) {
            map.removeLayer(accuracyCircleRef.current)
            accuracyCircleRef.current = null
        }

        if (!coordenadasValidas(lat, lng)) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current)
                markerRef.current = null
            }
            return
        }

        const alvo = L.latLng(lat, lng)
        const forcarCentralizacao = forcarCentralizacaoRef.current
        const zoomAlvo = zoomAlvoRef.current
        forcarCentralizacaoRef.current = false
        zoomAlvoRef.current = null

        if (Number.isFinite(precisao) && precisao > 0) {
            accuracyCircleRef.current = L.circle(alvo, {
                radius: precisao,
                color: "#d62828",
                weight: 1,
                opacity: 0.55,
                fillColor: "#d62828",
                fillOpacity: 0.08,
                interactive: false,
            }).addTo(map)
        }

        const precisaCentralizar = forcarCentralizacao ||
            !markerRef.current ||
            map.getCenter().distanceTo(alvo) > 1000

        posicionarMarcador(map, markerRef, alvo, onChangeRef)

        if (precisaCentralizar) {
            map.setView(alvo, zoomAlvo ?? Math.max(map.getZoom(), ZOOM_DETALHE))
        }
    }, [latitude, longitude])

    async function usarMinhaLocalizacao() {
        if (!window.isSecureContext) {
            setGeoStatus({
                texto: "A localização exige conexão segura (HTTPS). Abra o site pelo endereço oficial.",
                tipo: "erro",
            })
            return
        }

        if (!navigator.geolocation) {
            setGeoStatus({
                texto: "Seu navegador não oferece suporte a geolocalização.",
                tipo: "erro",
            })
            return
        }

        setGeoStatus({ texto: "Obtendo localização…", tipo: "info" })

        let posicao
        try {
            posicao = await obterPosicao({
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            })
        } catch (erro) {
            if (erro && erro.code === 1) {
                setGeoStatus({ texto: MENSAGENS_ERRO.PERMISSION_DENIED, tipo: "erro" })
                return
            }
            // Sem GPS/Wi-Fi disponível, tenta uma vez a localização por rede.
            try {
                setGeoStatus({ texto: "Precisão alta indisponível. Tentando pela rede…", tipo: "info" })
                posicao = await obterPosicao({
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 60000,
                })
            } catch (erroRede) {
                const chave = erroRede && erroRede.code === 3 ? "TIMEOUT" : "POSITION_UNAVAILABLE"
                setGeoStatus({ texto: MENSAGENS_ERRO[chave], tipo: "erro" })
                return
            }
        }

        const { latitude: lat, longitude: lng, accuracy } = posicao.coords
        const precisao = Number.isFinite(accuracy) ? accuracy : null

        precisaoPendenteRef.current = precisao
        forcarCentralizacaoRef.current = true
        zoomAlvoRef.current = zoomParaPrecisao(precisao)

        onChangeRef.current?.({ latitude: lat, longitude: lng })
        setGeoStatus(descreverPrecisao(precisao))
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
                {geoStatus.texto && (
                    <span
                        className={`phyto-map-toolbar__status phyto-map-toolbar__status--${geoStatus.tipo}`}
                        role={geoStatus.tipo === "erro" ? "alert" : "status"}
                    >
                        {geoStatus.texto}
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
