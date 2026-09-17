import React, { useRef, useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import { encodeId } from "../idCodec"

const MODEL_URL = `${process.env.PUBLIC_URL || ""}/my_model/`
const TF_SRC = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.4/dist/tf.min.js"
const TM_SRC = "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js"

let scriptsPromise = null

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.async = true
        script.onload = resolve
        script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`))
        document.head.appendChild(script)
    })
}

function loadTMScripts() {
    if (typeof window === "undefined" || (window.tf && window.tmImage)) return Promise.resolve()
    if (!scriptsPromise) {
        scriptsPromise = (async () => {
            if (!window.tf) await loadScript(TF_SRC)
            if (!window.tmImage) await loadScript(TM_SRC)
        })().catch(err => {
            scriptsPromise = null
            throw err
        })
    }
    return scriptsPromise
}

function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error("Falha ao ler o arquivo"))
        reader.readAsDataURL(file)
    })
}

const ResultRow = ({ p, isTop }) => (
    <li className={`identify-results__row${isTop ? " identify-results__row--top" : ""}`}>
        <div className="d-flex justify-content-between align-items-center gap-2">
            <span className="identify-results__class">{p.className}</span>
            <span className="identify-results__prob">{(p.probability * 100).toFixed(1)}%</span>
        </div>
        <div className="identify-results__bar">
            <div className="identify-results__fill" style={{ width: `${(p.probability * 100).toFixed(1)}%` }} />
        </div>
    </li>
)

export default function IdentificarPlanta() {
    const modelRef = useRef(null)
    const webcamRef = useRef(null)
    const rafRef = useRef(null)
    const frameRef = useRef(0)
    const webcamHostRef = useRef(null)
    const uploadCanvasRef = useRef(null)
    const fileInputRef = useRef(null)

    const [started, setStarted] = useState(false)
    const [phase, setPhase] = useState("idle")
    const [error, setError] = useState(null)
    const [processError, setProcessError] = useState(null)
    const [mode, setMode] = useState("webcam")
    const [camStatus, setCamStatus] = useState("off")
    const [camError, setCamError] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [preview, setPreview] = useState(null)
    const [predictions, setPredictions] = useState([])
    const [lookup, setLookup] = useState({ loading: false, match: null })

    const busyRef = useRef(false)

    const stopWebcam = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        const webcam = webcamRef.current
        if (webcam) {
            try { if (webcam.pause) webcam.pause() } catch (err) { void err }
            try { if (webcam.stop) webcam.stop() } catch (err) { void err }
        }
        webcamRef.current = null
        if (webcamHostRef.current) webcamHostRef.current.innerHTML = ""
        setCamStatus("off")
    }, [])

    useEffect(() => () => { stopWebcam() }, [stopWebcam])

    const buscarCatalogo = useCallback(async (query) => {
        setLookup({ loading: true, match: null })
        let plants = []
        try {
            const res = await fetch(`${API_URL}/plant?search=${encodeURIComponent(query)}`)
            if (res.ok) {
                const data = await res.json()
                plants = Array.isArray(data) ? data : []
            }
        } catch (err) { void err }
        setLookup({ loading: false, match: { query, plants } })
    }, [])

    const runPredict = useCallback(async (source) => {
        const model = modelRef.current
        if (!model || busyRef.current) return
        busyRef.current = true
        setProcessError(null)
        try {
            const pred = await model.predict(source)
            const top = (pred || []).slice(0, 3).map(p => ({
                className: p.className,
                probability: Number(p.probability) || 0,
            }))
            setPredictions(top)
            const top1 = top[0]
            if (top1 && top1.probability >= 0.05) {
                buscarCatalogo(top1.className)
            } else {
                setLookup({ loading: false, match: null })
            }
        } catch (err) {
            void err
            setProcessError("Não foi possível processar a imagem. Tente outra foto, mais nítida e focada na planta.")
        } finally {
            busyRef.current = false
        }
    }, [buscarCatalogo])

    const loopWebcam = useCallback(async () => {
        const webcam = webcamRef.current
        if (!webcam) return
        webcam.update()
        frameRef.current += 1
        if (frameRef.current % 3 === 0) {
            await runPredict(webcam.canvas)
        }
        if (webcamRef.current) {
            rafRef.current = requestAnimationFrame(loopWebcam)
        }
    }, [runPredict])

    const iniciarWebcam = useCallback(async () => {
        setCamStatus("starting")
        setCamError(null)
        setProcessError(null)
        setPredictions([])
        setLookup({ loading: false, match: null })
        const tmImage = window.tmImage
        if (!tmImage) {
            setCamError("Biblioteca de IA indisponível. Recarregue a página e tente novamente.")
            setCamStatus("error")
            return
        }
        stopWebcam()
        try {
            const webcam = new tmImage.Webcam(224, 224, true)
            await webcam.setup()
            await webcam.play()
            webcamRef.current = webcam
            frameRef.current = 0
            if (webcamHostRef.current) {
                webcamHostRef.current.innerHTML = ""
                webcam.canvas.classList.add("identify-webcam__canvas")
                webcamHostRef.current.appendChild(webcam.canvas)
            }
            setCamStatus("on")
            rafRef.current = requestAnimationFrame(loopWebcam)
        } catch (err) {
            const name = err && err.name
            setCamStatus("error")
            setCamError(
                name === "NotAllowedError" || name === "PermissionDeniedError"
                    ? "Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador."
                    : name === "NotFoundError" || name === "OverconstrainedError"
                        ? "Nenhuma câmera encontrada no dispositivo."
                        : "Não foi possível iniciar a câmera. Verifique se ela está disponível e tente novamente."
            )
        }
    }, [loopWebcam, stopWebcam])

    async function onFileSelect(e) {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        if (fileInputRef.current) fileInputRef.current.value = ""
        setProcessError(null)
        setProcessing(true)
        setPredictions([])
        setLookup({ loading: false, match: null })
        stopWebcam()
        try {
            const dataUrl = await readAsDataURL(file)
            const img = new Image()
            img.onload = () => {
                const canvas = uploadCanvasRef.current
                if (canvas) {
                    canvas.width = img.naturalWidth || img.width
                    canvas.height = img.naturalHeight || img.height
                    canvas.getContext("2d").drawImage(img, 0, 0)
                }
                setPreview(dataUrl)
                setProcessing(false)
                if (canvas) runPredict(canvas)
            }
            img.onerror = () => {
                setProcessing(false)
                setProcessError("Não foi possível ler esta imagem. Envie um arquivo JPG, PNG ou WebP.")
            }
            img.src = dataUrl
        } catch (err) {
            void err
            setProcessing(false)
            setProcessError("Não foi possível ler o arquivo. Tente novamente.")
        }
    }

    function changeMode(next) {
        setMode(next)
        setProcessError(null)
        if (next === "upload") stopWebcam()
    }

    async function handleStart() {
        setStarted(true)
        setPhase("loading")
        setError(null)
        try {
            await loadTMScripts()
        } catch (err) {
            console.error("[IdentificarPlanta] Falha ao carregar bibliotecas TensorFlow:", err)
            modelRef.current = null
            setPhase("error")
            setError("Não foi possível baixar as bibliotecas de IA (cdn.jsdelivr.net). Verifique sua conexão com a internet e tente novamente.")
            return
        }
        try {
            const tmImage = window.tmImage
            const model = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`)
            modelRef.current = model
            setPhase("ready")
        } catch (err) {
            console.error("[IdentificarPlanta] Falha ao carregar o modelo de IA:", err)
            modelRef.current = null
            setPhase("error")
            setError("Não foi possível carregar o modelo de IA. Se o erro persistir, recarregue a página (Ctrl+F5) e tente novamente.")
        }
    }

    return (
        <div className="identify card shadow-sm">
            <div className="card-body">
                <div className="identify__header">
                    <div className="identify__icon" aria-hidden="true">🌿</div>
                    <div>
                        <h4 className="identify__title mb-1">Identifique uma planta com IA</h4>
                        <p className="identify__subtitle text-muted mb-0">
                            Tire uma foto pela câmera ou envie uma imagem para a IA apontar a espécie.
                        </p>
                    </div>
                </div>

                {!started && (
                    <div className="text-center mt-3">
                        <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleStart}>
                            Iniciar identificação
                        </button>
                    </div>
                )}

                {started && phase === "loading" && (
                    <div className="identify__loading text-center py-4" role="status">
                        <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Carregando modelo de IA...
                    </div>
                )}

                {started && phase === "error" && (
                    <div className="alert alert-danger mb-3 mt-3" role="alert">
                        {error}
                        <div className="mt-2">
                            <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={handleStart}>
                                Tentar novamente
                            </button>
                        </div>
                    </div>
                )}

                {started && phase === "ready" && (
                    <>
                        <div className="identify__tabs mt-3" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mode === "webcam"}
                                className={`identify__tab${mode === "webcam" ? " is-active" : ""}`}
                                onClick={() => changeMode("webcam")}
                            >
                                Câmera
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mode === "upload"}
                                className={`identify__tab${mode === "upload" ? " is-active" : ""}`}
                                onClick={() => changeMode("upload")}
                            >
                                Enviar foto
                            </button>
                        </div>

                        <div className="identify__body">
                            {mode === "webcam" && (
                                <div className="identify-webcam">
                                    <div ref={webcamHostRef} className="identify-webcam__host" />
                                    {camStatus === "off" && (
                                        <div className="text-center">
                                            <button type="button" className="btn btn-outline-primary rounded-pill" onClick={iniciarWebcam}>
                                                Ativar câmera
                                            </button>
                                            <p className="small text-muted mt-2 mb-0">
                                                Permita o acesso à câmera quando o navegador pedir.
                                            </p>
                                        </div>
                                    )}
                                    {camStatus === "starting" && (
                                        <div className="small text-muted text-center py-3">Abrindo câmera...</div>
                                    )}
                                    {camStatus === "error" && (
                                        <div className="alert alert-warning small mb-2" role="alert">
                                            {camError}
                                        </div>
                                    )}
                                    {camStatus === "on" && (
                                        <div className="text-center">
                                            <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={stopWebcam}>
                                                Parar câmera
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === "upload" && (
                                <div className="identify-upload">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="form-control"
                                        onChange={onFileSelect}
                                        aria-label="Escolher imagem para identificação"
                                    />
                                    {processing && (
                                        <div className="small text-muted mt-2" role="status">
                                            <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                                            Processando imagem...
                                        </div>
                                    )}
                                    {preview && !processing && (
                                        <img src={preview} alt="Imagem enviada para identificação" className="identify-upload__preview" />
                                    )}
                                    <canvas ref={uploadCanvasRef} style={{ display: "none" }} />
                                </div>
                            )}

                            {processError && (
                                <div className="alert alert-warning small mt-3 mb-0" role="alert">
                                    {processError}
                                </div>
                            )}

                            {(predictions.length > 0 || camStatus === "on") && (
                                <div className="identify-results mt-3">
                                    <h5 className="identify-results__title">Resultado</h5>
                                    {predictions.length > 0 ? (
                                        <ul className="identify-results__list list-unstyled mb-0">
                                            {predictions.map((p, i) => (
                                                <ResultRow key={`${p.className}-${i}`} p={p} isTop={i === 0} />
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="small text-muted mb-0">
                                            {mode === "webcam" ? "Apontando a câmera para a planta..." : "Processando a imagem..."}
                                        </p>
                                    )}

                                    <div className="identify-results__match mt-3">
                                        {lookup.loading && <div className="small text-muted">Buscando no catálogo...</div>}
                                        {!lookup.loading && lookup.match && lookup.match.plants.length === 1 && (
                                            <Link
                                                className="identify-results__link"
                                                to={`/plantdetails/${encodeId(lookup.match.plants[0]._id)}`}
                                            >
                                                Ficha encontrada no catálogo: {lookup.match.plants[0].name} →
                                            </Link>
                                        )}
                                        {!lookup.loading && lookup.match && lookup.match.plants.length > 1 && (
                                            <Link
                                                className="identify-results__link"
                                                to={`/plantlist?search=${encodeURIComponent(lookup.match.query)}`}
                                            >
                                                {lookup.match.plants.length} plantas correspondem no catálogo. Ver resultados →
                                            </Link>
                                        )}
                                        {!lookup.loading && lookup.match && lookup.match.plants.length === 0 && (
                                            <Link
                                                className="identify-results__link identify-results__link--muted"
                                                to={`/plantlist?search=${encodeURIComponent(lookup.match.query)}`}
                                            >
                                                Buscar “{lookup.match.query}” no catálogo →
                                            </Link>
                                        )}
                                        {!lookup.loading && !lookup.match && <div className="small text-muted">Aguarde a predição...</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}