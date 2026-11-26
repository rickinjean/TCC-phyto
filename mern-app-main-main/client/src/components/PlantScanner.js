import React, { useEffect, useRef, useState } from "react"

const MODEL_URL = process.env.REACT_APP_TEACHABLE_MACHINE_MODEL_URL || `${process.env.PUBLIC_URL || ""}/my_model/`
const TFJS_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"
const TM_IMAGE_URL = "https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"

function loadScript(src, marker) {
    if (window[marker]) return Promise.resolve()
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing) {
            existing.addEventListener("load", resolve, { once: true })
            existing.addEventListener("error", reject, { once: true })
            return
        }
        const script = document.createElement("script")
        script.src = src
        script.async = true
        script.onload = resolve
        script.onerror = () => reject(new Error("Não foi possível carregar a biblioteca de reconhecimento."))
        document.head.appendChild(script)
    })
}

export default function PlantScanner() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [cameraOn, setCameraOn] = useState(false)
    const [predictions, setPredictions] = useState([])
    const [error, setError] = useState("")
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const modelRef = useRef(null)
    const imageRef = useRef(null)
    const fileRef = useRef(null)

    useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), [])

    useEffect(() => {
        if (!cameraOn || !videoRef.current || !streamRef.current) return
        videoRef.current.srcObject = streamRef.current
        videoRef.current.play().catch(() => setError("Não foi possível iniciar a prévia da câmera."))
    }, [cameraOn])

    async function getModel() {
        if (modelRef.current) return modelRef.current
        setLoading(true)
        setError("")
        try {
            await loadScript(TFJS_URL, "tf")
            await loadScript(TM_IMAGE_URL, "tmImage")
            modelRef.current = await window.tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`)
            return modelRef.current
        } catch (err) {
            setError("Modelo não encontrado ou indisponível. Adicione os arquivos do Teachable Machine em client/public/my_model/.")
            throw err
        } finally {
            setLoading(false)
        }
    }

    async function classify(image) {
        setError("")
        setPredictions([])
        try {
            const model = await getModel()
            const result = await model.predict(image)
            setPredictions(result.sort((a, b) => b.probability - a.probability))
        } catch (err) {
            if (modelRef.current) setError("Não foi possível analisar a imagem. Verifique se ela é válida e tente novamente.")
        }
    }

    async function toggleCamera() {
        if (cameraOn) {
            streamRef.current?.getTracks().forEach(track => track.stop())
            streamRef.current = null
            setCameraOn(false)
            return
        }
        setError("")
        try {
            await getModel()
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            streamRef.current = stream
            setCameraOn(true)
        } catch (err) {
            if (err.name === "NotAllowedError") setError("Permita o acesso à câmera para escanear a planta.")
            else if (err.name === "NotFoundError") setError("Nenhuma câmera foi encontrada neste dispositivo.")
            else if (!modelRef.current) return
            else setError("Não foi possível abrir a câmera. Confira as permissões do navegador.")
        }
    }

    async function captureFrame() {
        if (videoRef.current) await classify(videoRef.current)
    }

    function handleFile(event) {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) {
            setError("Selecione um arquivo de imagem.")
            return
        }
        const image = new Image()
        const imageUrl = URL.createObjectURL(file)
        image.onload = () => {
            imageRef.current = image
            URL.revokeObjectURL(imageUrl)
            classify(image)
        }
        image.onerror = () => {
            URL.revokeObjectURL(imageUrl)
            setError("Não foi possível abrir essa imagem.")
        }
        image.src = imageUrl
        event.target.value = ""
    }

    return (
        <section className="plant-scanner mb-3" aria-label="Identificação de plantas por imagem">
            <div className="plant-scanner__intro">
                <div>
                    <h2 className="plant-scanner__title">Identificar planta por imagem</h2>
                    <p className="plant-scanner__description">Use a câmera ou envie uma foto para consultar o modelo de reconhecimento.</p>
                </div>
                <button type="button" className="btn plant-scanner__toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>
                    <i className="fas fa-camera me-2" aria-hidden="true" />{open ? "Fechar" : "Abrir scanner"}
                </button>
            </div>
            {open && <div className="plant-scanner__body">
                <div className="plant-scanner__actions">
                    <button type="button" className="btn plant-scanner__action" onClick={toggleCamera} disabled={loading}>
                        <i className={`fas ${cameraOn ? "fa-stop" : "fa-video"} me-2`} aria-hidden="true" />{cameraOn ? "Desligar câmera" : "Abrir câmera"}
                    </button>
                    <button type="button" className="btn plant-scanner__action plant-scanner__action--secondary" onClick={() => fileRef.current?.click()} disabled={loading}>
                        <i className="fas fa-image me-2" aria-hidden="true" />Enviar foto
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="visually-hidden" onChange={handleFile} aria-label="Selecionar foto da planta" />
                </div>
                {loading && <p className="plant-scanner__status" role="status">Carregando modelo...</p>}
                {cameraOn && <div className="plant-scanner__camera"><video ref={videoRef} playsInline muted /><button type="button" className="btn plant-scanner__toggle" onClick={captureFrame}>Capturar e identificar</button></div>}
                {error && <p className="plant-scanner__error" role="alert">{error}</p>}
                {predictions.length > 0 && <div className="plant-scanner__results" aria-live="polite">
                    <h3>Resultados do modelo</h3>
                    {predictions.map(item => <div className="plant-scanner__prediction" key={item.className}>
                        <span>{item.className}</span><strong>{(item.probability * 100).toFixed(1)}%</strong>
                        <div className="plant-scanner__meter"><span style={{ width: `${Math.max(0, Math.min(100, item.probability * 100))}%` }} /></div>
                    </div>)}
                </div>}
            </div>}
        </section>
    )
}
