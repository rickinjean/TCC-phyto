import { useCallback, useEffect, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"
import * as mobilenet from "@tensorflow-models/mobilenet"
import * as knnClassifier from "@tensorflow-models/knn-classifier"
import API_URL from "./config"
import { restaurarDataset, capturarTensorTM } from "./modeloCodec"

const IMAGE_SIZE = 224

// Hook central da página /identificador: carrega a lista de modelos do
// servidor, seleciona um (KNN treinado no app ou TM importado) e prediz.
export default function useIdentificador() {
    const [modelos, setModelos] = useState([])
    const [modeloAtivo, setModeloAtivo] = useState(null)
    const [status, setStatus] = useState("sem-modelo") // sem-modelo | carregando | pronto | erro
    const [erroMsg, setErroMsg] = useState("")
    const [predicoes, setPredicoes] = useState([])

    const mobilenetRef = useRef(null)
    const knnRef = useRef(null)
    const classesRef = useRef([])
    const tmModelRef = useRef(null)
    const tmMetaRef = useRef(null)

    // Dispose de todos os recursos carregados
    const descartarTudo = useCallback(function () {
        try { if (knnRef.current) knnRef.current.dispose() } catch (e) { /* ignore */ }
        try { if (mobilenetRef.current) mobilenetRef.current.dispose() } catch (e) { /* ignore */ }
        try { if (tmModelRef.current) tmModelRef.current.dispose() } catch (e) { /* ignore */ }
        knnRef.current = null
        mobilenetRef.current = null
        tmModelRef.current = null
        tmMetaRef.current = null
        classesRef.current = []
    }, [])

    useEffect(function () {
        return descartarTudo
    }, [descartarTudo])

    async function garantirMobilenet() {
        if (!mobilenetRef.current) {
            mobilenetRef.current = await mobilenet.load({ version: 1, alpha: 0.5 })
        }
    }

    const carregarModelos = useCallback(async function () {
        try {
            const res = await fetch(`${API_URL}/ai/models`)
            if (!res.ok) return
            setModelos(await res.json())
        } catch (e) {
            // Lista indisponível: o usuário vê "nenhum modelo disponível".
        }
    }, [])

    const selecionarModelo = useCallback(async function (modelo) {
        if (!modelo) {
            descartarTudo()
            setModeloAtivo(null)
            setPredicoes([])
            setStatus("sem-modelo")
            setErroMsg("")
            return
        }
        setModeloAtivo(modelo)
        setPredicoes([])
        setErroMsg("")
        setStatus("carregando")
        try {
            if (modelo.tipo === "knn") {
                await garantirMobilenet()
                const res = await fetch(`${API_URL}/ai/models/${modelo._id}/dataset`)
                if (!res.ok) throw new Error("Não foi possível baixar o dataset do modelo")
                const payload = await res.json()
                knnRef.current = knnClassifier.create()
                restaurarDataset(knnRef.current, payload.dataset || {})
                classesRef.current = payload.classes || []
                if (!payload.dataset || Object.keys(payload.dataset).length === 0) {
                    throw new Error("O modelo não possui exemplos de treinamento")
                }
            } else {
                // Modelo exportado do Teachable Machine: carregado com tf.loadLayersModel
                // diretamente (a lib @teachablemachine/image fixa tfjs 1.3.1, incompatível).
                const modelURL = `${API_URL}/ai/models/${modelo._id}/files/model.json`
                tmModelRef.current = await tf.loadLayersModel(modelURL)
                const metaRes = await fetch(`${API_URL}/ai/models/${modelo._id}/files/metadata.json`)
                if (!metaRes.ok) throw new Error("Falha ao carregar metadados do modelo")
                tmMetaRef.current = await metaRes.json()
            }
            setStatus("pronto")
        } catch (e) {
            setStatus("erro")
            setErroMsg((e && e.message) || "Falha ao carregar o modelo")
        }
    }, [descartarTudo])

    // Prediz a partir de um elemento (video, img ou canvas). Retorna array
    // [{ label, prob }] ordenado do mais provável para o menos provável.
    const predizer = useCallback(async function (elemento) {
        if (status !== "pronto" || !elemento) return null

        if (modeloAtivo.tipo === "knn") {
            if (!knnRef.current || !mobilenetRef.current) return null
            const embed = mobilenetRef.current.infer(elemento, true)
            try {
                const result = await knnRef.current.predictClass(embed, 3)
                const labels = classesRef.current
                const lista = []
                for (const [key, prob] of Object.entries(result.confidences || {})) {
                    const classe = labels.find(function (c) { return String(c.id) === key })
                    lista.push({ label: classe ? classe.nome : key, prob: prob })
                }
                lista.sort(function (a, b) { return b.prob - a.prob })
                return lista
            } finally {
                if (embed) embed.dispose()
            }
        } else {
            const meta = tmMetaRef.current || {}
            const size = meta.imageSize || IMAGE_SIZE
            const labels = meta.labels || []
            const tensor = capturarTensorTM(elemento, size)
            let out
            try {
                out = tmModelRef.current.predict(tensor)
                const values = await out.data()
                const lista = []
                for (let i = 0; i < values.length; i++) {
                    lista.push({ label: labels[i] || "Classe " + (i + 1), prob: values[i] })
                }
                lista.sort(function (a, b) { return b.prob - a.prob })
                return lista
            } finally {
                try { if (out) out.dispose() } catch (e) { /* ignore */ }
                try { tensor.dispose() } catch (e) { /* ignore */ }
            }
        }
    }, [status, modeloAtivo])

    return {
        modelos, carregarModelos,
        modeloAtivo, selecionarModelo,
        status, erroMsg, setErroMsg,
        predicoes, setPredicoes, predizer,
        descartarTudo,
    }
}