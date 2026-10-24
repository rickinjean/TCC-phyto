import { useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import {
    SEM_REGISTRO,
    STATUS_DISTRIBUICAO,
    buscarPaises,
    nomeDoPais,
} from "../distribuicao"

// Enquadramento inicial: corta a Antártida para o mapa não ficar espremido.
const MUNDO = L.latLngBounds([[-58, -180], [84, 180]])

const CORES_PADRAO = {
    nativa: "#2f7d4f",
    cultivada: "#c98a1e",
    vazia: "#e2e9e3",
    borda: "#b7c7bc",
    destaque: "#1f6b49",
}

function lerCores() {
    if (typeof window === "undefined") return CORES_PADRAO
    const estilo = getComputedStyle(document.documentElement)
    const ler = (nome, padrao) => (estilo.getPropertyValue(nome) || "").trim() || padrao
    return {
        nativa: ler("--phyto-dist-nativa", CORES_PADRAO.nativa),
        cultivada: ler("--phyto-dist-cultivada", CORES_PADRAO.cultivada),
        vazia: ler("--phyto-dist-vazia", CORES_PADRAO.vazia),
        borda: ler("--phyto-dist-borda", CORES_PADRAO.borda),
        destaque: ler("--phyto-dist-destaque", CORES_PADRAO.destaque),
    }
}

export default function MapaDistribuicao({
    nativa = [],
    cultivada = [],
    editavel = false,
    onChange,
    height,
}) {
    const containerRef = useRef(null)
    const mapRef = useRef(null)
    const layerRef = useRef(null)
    const camadasRef = useRef(new Map())
    const coresRef = useRef(CORES_PADRAO)
    const setsRef = useRef({ nativa: new Set(), cultivada: new Set() })
    const onChangeRef = useRef(onChange)
    const editavelRef = useRef(editavel)
    const modoRef = useRef("nativa")

    const [carregado, setCarregado] = useState(false)
    const [erro, setErro] = useState("")
    const [modo, setModo] = useState("nativa")
    const [busca, setBusca] = useState("")
    const [confirmarLimpeza, setConfirmarLimpeza] = useState(false)

    const nativaSet = useMemo(() => new Set(nativa), [nativa])
    const cultivadaSet = useMemo(() => new Set(cultivada), [cultivada])

    onChangeRef.current = onChange
    editavelRef.current = editavel
    modoRef.current = modo

    const resultados = useMemo(() => buscarPaises(busca), [busca])

    function statusDe(codigo) {
        const sets = setsRef.current
        if (sets.nativa.has(codigo)) return "nativa"
        if (sets.cultivada.has(codigo)) return "cultivada"
        return null
    }

    function rotuloStatus(codigo) {
        const status = statusDe(codigo)
        return status ? STATUS_DISTRIBUICAO[status] : SEM_REGISTRO
    }

    function estiloDoPais(codigo) {
        const cores = coresRef.current
        const status = statusDe(codigo)
        return {
            fillColor: status ? cores[status] : cores.vazia,
            fillOpacity: status ? 0.88 : 0.9,
            color: cores.borda,
            weight: 0.5,
        }
    }

    function aplicarEstilos() {
        const camada = layerRef.current
        if (!camada) return
        camada.eachLayer(layer => {
            const codigo = layer.feature?.properties?.codigo
            if (!codigo) return
            layer.setStyle(estiloDoPais(codigo))
            layer.setTooltipContent(`${nomeDoPais(codigo)} — ${rotuloStatus(codigo)}`)
        })
    }

    function alternarPais(codigo) {
        const sets = setsRef.current
        const acao = modoRef.current
        const proximaNativa = new Set(sets.nativa)
        const proximaCultivada = new Set(sets.cultivada)

        if (acao === "apagar") {
            proximaNativa.delete(codigo)
            proximaCultivada.delete(codigo)
        } else if (acao === "nativa") {
            if (proximaNativa.has(codigo)) proximaNativa.delete(codigo)
            else {
                proximaNativa.add(codigo)
                proximaCultivada.delete(codigo)
            }
        } else {
            if (proximaCultivada.has(codigo)) proximaCultivada.delete(codigo)
            else {
                proximaCultivada.add(codigo)
                proximaNativa.delete(codigo)
            }
        }

        setsRef.current = { nativa: proximaNativa, cultivada: proximaCultivada }
        aplicarEstilos()
        onChangeRef.current?.({
            nativa: [...proximaNativa],
            cultivada: [...proximaCultivada],
        })
    }

    function aoClicar(codigo) {
        if (!editavelRef.current) {
            camadasRef.current.get(codigo)?.openTooltip()
            return
        }
        alternarPais(codigo)
    }

    useEffect(() => {
        setsRef.current = { nativa: nativaSet, cultivada: cultivadaSet }
        aplicarEstilos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nativaSet, cultivadaSet])

    useEffect(() => {
        const container = containerRef.current
        if (!container || mapRef.current) return

        const camadas = camadasRef.current
        coresRef.current = lerCores()

        const map = L.map(container, {
            center: [12, 0],
            zoom: 1.5,
            zoomSnap: 0.25,
            zoomDelta: 0.5,
            minZoom: 0.5,
            maxZoom: 5,
            scrollWheelZoom: false,
            worldCopyJump: false,
            maxBounds: [[-85, -190], [85, 190]],
            maxBoundsViscosity: 1,
            attributionControl: false,
            zoomControl: true,
        })
        mapRef.current = map

        let cancelado = false

        import("../data/paises-110m.geo.json")
            .then(mod => {
                if (cancelado || mapRef.current !== map) return
                const dados = mod.default || mod
                const camada = L.geoJSON(dados, {
                    style: feature => estiloDoPais(feature.properties.codigo),
                    onEachFeature: (feature, layer) => {
                        const codigo = feature.properties.codigo
                        camadasRef.current.set(codigo, layer)
                        layer.bindTooltip(`${nomeDoPais(codigo)} — ${rotuloStatus(codigo)}`, {
                            sticky: true,
                            direction: "top",
                            className: "phyto-dist-tooltip",
                            opacity: 1,
                        })
                        layer.on({
                            click: () => aoClicar(codigo),
                            mouseover: () => layer.setStyle({
                                weight: 1.6,
                                color: coresRef.current.destaque,
                            }),
                            mouseout: () => layer.setStyle(estiloDoPais(codigo)),
                        })
                    },
                }).addTo(map)
                layerRef.current = camada
                map.fitBounds(MUNDO, { animate: false, padding: [0, 0] })
                setCarregado(true)
            })
            .catch(() => {
                if (!cancelado) setErro("Não foi possível carregar o mapa de países.")
            })

        const aoRedimensionar = () => map.invalidateSize()
        const observador = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(aoRedimensionar)
            : null
        if (observador) observador.observe(container)
        const timer = setTimeout(() => map.invalidateSize(), 0)

        // As cores vêm das variáveis CSS: ao trocar de tema, repinta sem recriar o mapa.
        const observadorTema = new MutationObserver(() => {
            coresRef.current = lerCores()
            aplicarEstilos()
        })
        observadorTema.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        })

        return () => {
            cancelado = true
            clearTimeout(timer)
            if (observador) observador.disconnect()
            observadorTema.disconnect()
            map.remove()
            mapRef.current = null
            layerRef.current = null
            camadas.clear()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const totalMarcado = nativa.length + cultivada.length

    return (
        <div className={`phyto-dist${editavel ? " phyto-dist--editavel" : ""}`}>
            {editavel && (
                <div className="phyto-dist-toolbar">
                    <div className="phyto-dist-brushes" role="group" aria-label="O que aplicar ao clicar em um país">
                        <button
                            type="button"
                            className={`phyto-dist-brush phyto-dist-brush--nativa${modo === "nativa" ? " is-active" : ""}`}
                            aria-pressed={modo === "nativa"}
                            onClick={() => setModo("nativa")}
                        >
                            🌿 Nativa
                        </button>
                        <button
                            type="button"
                            className={`phyto-dist-brush phyto-dist-brush--cultivada${modo === "cultivada" ? " is-active" : ""}`}
                            aria-pressed={modo === "cultivada"}
                            onClick={() => setModo("cultivada")}
                        >
                            🌾 Cultivada
                        </button>
                        <button
                            type="button"
                            className={`phyto-dist-brush phyto-dist-brush--apagar${modo === "apagar" ? " is-active" : ""}`}
                            aria-pressed={modo === "apagar"}
                            onClick={() => setModo("apagar")}
                        >
                            🧽 Apagar
                        </button>
                    </div>

                    <div className="phyto-dist-search">
                        <input
                            type="search"
                            className="form-control form-control-sm"
                            placeholder="Buscar país…"
                            value={busca}
                            onChange={evento => setBusca(evento.target.value)}
                            aria-label="Buscar país para marcar no mapa"
                        />
                        {resultados.length > 0 && (
                            <ul className="phyto-dist-search__list">
                                {resultados.map(pais => {
                                    const status = statusDe(pais.codigo)
                                    return (
                                        <li key={pais.codigo}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    alternarPais(pais.codigo)
                                                    setBusca("")
                                                }}
                                            >
                                                <span>{pais.nome}</span>
                                                <small>
                                                    {status ? STATUS_DISTRIBUICAO[status] : SEM_REGISTRO}
                                                    {!pais.temMapa && " · sem polígono no mapa"}
                                                </small>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>

                    <p className="phyto-dist-count">
                        <span className="phyto-dist-count__item phyto-dist-count__item--nativa">
                            {nativa.length} nativa{nativa.length === 1 ? "" : "s"}
                        </span>
                        <span className="phyto-dist-count__item phyto-dist-count__item--cultivada">
                            {cultivada.length} cultivada{cultivada.length === 1 ? "" : "s"}
                        </span>
                    </p>

                    {confirmarLimpeza ? (
                        <span className="phyto-dist-confirm">
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                    setsRef.current = { nativa: new Set(), cultivada: new Set() }
                                    aplicarEstilos()
                                    onChangeRef.current?.({ nativa: [], cultivada: [] })
                                    setConfirmarLimpeza(false)
                                }}
                            >
                                Confirmar
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setConfirmarLimpeza(false)}
                            >
                                Cancelar
                            </button>
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setConfirmarLimpeza(true)}
                            disabled={totalMarcado === 0}
                        >
                            Limpar tudo
                        </button>
                    )}
                </div>
            )}

            <div className="phyto-dist-map-wrap">
                <div
                    ref={containerRef}
                    className="phyto-map phyto-dist-map"
                    style={height ? { height } : undefined}
                    aria-label="Mapa mundial de distribuição geográfica"
                />
                {!carregado && !erro && (
                    <p className="phyto-dist-status" role="status">Carregando mapa…</p>
                )}
                {erro && (
                    <p className="phyto-dist-status phyto-dist-status--erro" role="alert">{erro}</p>
                )}
            </div>

            <ul className="phyto-dist-legend">
                <li>
                    <span className="phyto-dist-swatch phyto-dist-swatch--nativa" aria-hidden="true" />
                    Nativa <strong>{nativa.length}</strong>
                </li>
                <li>
                    <span className="phyto-dist-swatch phyto-dist-swatch--cultivada" aria-hidden="true" />
                    Cultivada / introduzida <strong>{cultivada.length}</strong>
                </li>
                <li>
                    <span className="phyto-dist-swatch phyto-dist-swatch--vazia" aria-hidden="true" />
                    Sem registro
                </li>
            </ul>

            <p className="phyto-dist-attribution">
                Geometria: Natural Earth (domínio público).
            </p>
        </div>
    )
}
