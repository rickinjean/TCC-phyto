import { useEffect, useRef, useState } from "react"

// Painel de origem da imagem: webcam (ao vivo) ou upload de foto.
// Informa à página o elemento ativo via onFonte(elemento, tipo).
export default function ImageInput({ onFonte }) {
    const videoRef = useRef(null)
    const imgRef = useRef(null)
    const streamRef = useRef(null)
    const urlRef = useRef(null)

    const [webcamAtivo, setWebcamAtivo] = useState(false)
    const [erro, setErro] = useState("")
    const [preview, setPreview] = useState(null) // URL da imagem enviada

    const pararWebcam = function () {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(function (t) { t.stop() })
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        setWebcamAtivo(false)
        onFonte(null, null)
    }

    useEffect(function () {
        return function () {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(function (t) { t.stop() })
            }
            if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function ligarWebcam() {
        setErro("")
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } },
                audio: false,
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setWebcamAtivo(true)
                try { await videoRef.current.play() } catch (e) { /* ok */ }
                onFonte(videoRef.current, "webcam")
            }
        } catch (e) {
            setErro("Não foi possível acessar a câmera. Verifique as permissões do navegador.")
        }
    }

    function enviarArquivo(e) {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const url = URL.createObjectURL(file)
        urlRef.current = url
        setPreview(url)
        setErro("")
        const img = new Image()
        img.onload = function () {
            onFonte(img, "arquivo")
        }
        img.onerror = function () {
            setErro("Arquivo de imagem inválido.")
        }
        img.src = url
    }

    return (
        <div className="identificador__source">
            <div className="identificador__capture">
                {webcamAtivo ? (
                    <video ref={videoRef} className="identificador__video" autoPlay playsInline muted />
                ) : preview ? (
                    <img ref={imgRef} className="identificador__video" src={preview} alt="Imagem enviada" decoding="async" />
                ) : (
                    <div className="identificador__placeholder">
                        <span className="identificador__placeholder-icon" aria-hidden="true">🌿</span>
                        <p className="identificador__placeholder-text">
                            Ative a câmera ou envie uma foto para identificar a planta.
                        </p>
                    </div>
                )}
            </div>

            {erro && <p className="text-danger small mt-2 mb-0">{erro}</p>}

            <div className="identificador__actions">
                <button
                    type="button"
                    className="btn btn-outline-secondary ident-btn"
                    onClick={webcamAtivo ? pararWebcam : ligarWebcam}
                >
                    {webcamAtivo ? "⏹ Desativar câmera" : "📷 Ativar câmera"}
                </button>
                <label className="btn btn-outline-secondary ident-btn">
                    🖼 Enviar foto
                    <input type="file" accept="image/*" className="d-none" onChange={enviarArquivo} />
                </label>
            </div>
        </div>
    )
}