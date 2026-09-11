import { useEffect, useRef, useState } from "react"

// Webcam usada pelo Treinador: expõe o elemento <video> ao pai via onVideo.
export default function WebcamCapture({ onVideo }) {
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const [ativo, setAtivo] = useState(false)
    const [erro, setErro] = useState("")

    useEffect(function () {
        return function () {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(function (t) { t.stop() })
            }
        }
    }, [])

    async function ligar() {
        setErro("")
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } },
                audio: false,
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                try { await videoRef.current.play() } catch (e) { /* ok */ }
                setAtivo(true)
                if (onVideo) onVideo(videoRef.current)
            }
        } catch (e) {
            setErro("Não foi possível acessar a câmera. Verifique as permissões.")
        }
    }

    function desligar() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(function (t) { t.stop() })
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        setAtivo(false)
        if (onVideo) onVideo(null)
    }

    return (
        <div className="treinador__webcam">
            <div className="treinador__capture">
                {ativo ? (
                    <video ref={videoRef} className="treinador__video" autoPlay playsInline muted />
                ) : (
                    <div className="treinador__placeholder">
                        <span aria-hidden="true">📷</span>
                        <p>Ative a câmera para capturar exemplos por fotos ao vivo.</p>
                    </div>
                )}
            </div>
            {erro && <p className="text-danger small mt-2 mb-0">{erro}</p>}
            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={ativo ? desligar : ligar}
            >
                {ativo ? "⏹ Desligar câmera" : "📷 Ligar câmera"}
            </button>
        </div>
    )
}