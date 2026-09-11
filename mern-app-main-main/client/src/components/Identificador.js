import { useCallback, useEffect, useRef, useState } from "react"
import useIdentificador from "../useIdentificador"
import usePageTitle from "../usePageTitle"
import ModelSelector from "./identificador/ModelSelector"
import ImageInput from "./identificador/ImageInput"
import PredictionDisplay from "./identificador/PredictionDisplay"

const TM_URL = "https://teachablemachine.withgoogle.com/train/image"

// Página pública de identificação de plantas por foto/webcam.
export default function Identificador({ role }) {
    usePageTitle("Identificador de Plantas", "Identifique plantas por foto ou webcam usando modelos de IA treinados no Phytografia.", "/identificador")

    const { modelos, carregarModelos, modeloAtivo, selecionarModelo, status, erroMsg, predicoes, setPredicoes, predizer } = useIdentificador()

    const fonteRef = useRef(null)
    const [fonteKey, setFonteKey] = useState(0)
    const [fonteEstatica, setFonteEstatica] = useState(false)

    useEffect(function () { carregarModelos() }, [carregarModelos])

    const handlerFonte = useCallback(function (elemento, tipo) {
        fonteRef.current = elemento
        setFonteEstatica(tipo === "arquivo")
        setFonteKey(function (k) { return k + 1 })
    }, [])

    // Loop de predição: contínuo para a webcam, único para foto enviada.
    useEffect(function () {
        if (status !== "pronto" || !fonteRef.current) return

        if (fonteEstatica) {
            let cancelado = false
            predizer(fonteRef.current).then(function (r) {
                if (!cancelado) setPredicoes(r || [])
            }).catch(function () {
                if (!cancelado) setPredicoes([])
            })
            return function () { cancelado = true }
        }

        let parado = false
        let executando = false
        let raf = 0
        const loop = async function () {
            if (parado) return
            if (!executando && fonteRef.current) {
                executando = true
                try {
                    const r = await predizer(fonteRef.current)
                    if (!parado) setPredicoes(r || [])
                } catch (e) {
                    // erro pontual na inferência não derruba o loop
                } finally {
                    executando = false
                }
            }
            raf = requestAnimationFrame(loop)
        }
        loop()
        return function () {
            parado = true
            cancelAnimationFrame(raf)
        }
    }, [status, fonteKey, fonteEstatica, predizer, setPredicoes])

    return (
        <div className="identificador container py-4">
            <div className="identificador__cabecalho">
                <h1 className="identificador__titulo">🔍 Identificador de Plantas</h1>
                <p className="identificador__subtitulo">
                    Aponte a câmera ou envie uma foto e descubra qual planta está na imagem.
                    Tecnologia de IA treinada com o Teachable Machine.
                </p>
            </div>

            <ModelSelector
                modelos={modelos}
                selecionadoId={modeloAtivo ? modeloAtivo._id : ""}
                onSelecionar={selecionarModelo}
            />

            <div className="identificador__painel">
                <div className="identificador__painel-esquerda">
                    <ImageInput onFonte={handlerFonte} />
                </div>
                <div className="identificador__painel-direita">
                    <PredictionDisplay predicoes={predicoes} status={status} erroMsg={erroMsg} />

                    <div className="identificador__links">
                        <a className="btn btn-outline-success btn-sm" href={TM_URL} target="_blank" rel="noopener noreferrer">
                            🎓 Treinar um modelo no Teachable Machine
                        </a>
                        {role === "ADM" && (
                            <a className="btn btn-outline-secondary btn-sm" href="/treinador">
                                🧪 Treinador (criar modelo no app)
                            </a>
                        )}
                        {role === "ADM" && (
                            <a className="btn btn-outline-secondary btn-sm" href="/gerir-modelos">
                                🤖 Gerir modelos de IA
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}