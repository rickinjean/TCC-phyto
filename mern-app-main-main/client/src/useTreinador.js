import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"
import * as mobilenet from "@tensorflow-models/mobilenet"
import * as knnClassifier from "@tensorflow-models/knn-classifier"
import API_URL from "./config"
import authFetch from "./authFetch"
import { montarPayloadKNN } from "./modeloCodec"

let proximoId = 0

// Hook do Treinador de Plantas (/treinador, ADM): cria classes, adiciona
// exemplos (webcam ou upload) e salva o modelo KNN no servidor.
export default function useTreinador() {
    const [classes, setClasses] = useState([])
    const [status, setStatus] = useState("carregando") // carregando | pronto | erro
    const [erroMsg, setErroMsg] = useState("")
    const [tick, setTick] = useState(0)

    const mobilenetRef = useRef(null)
    const knnRef = useRef(null)
    const exemplosRef = useRef([])

    useEffect(function () {
        let cancelado = false
        async function carregar() {
            try {
                mobilenetRef.current = await mobilenet.load({ version: 1, alpha: 0.5 })
                if (!cancelado) setStatus("pronto")
            } catch (e) {
                if (!cancelado) {
                    setStatus("erro")
                    setErroMsg("Não foi possível carregar o modelo de IA. Verifique sua conexão.")
                }
            }
        }
        carregar()
        return function () {
            cancelado = true
            try { if (knnRef.current) knnRef.current.dispose() } catch (e) { /* ignore */ }
            try { if (mobilenetRef.current) mobilenetRef.current.dispose() } catch (e) { /* ignore */ }
        }
    }, [])

    function tocarContagens() { setTick(function (t) { return t + 1 }) }

    // Reconstroi o classificador KNN a partir dos vetores armazenados, usado
    // ao remover uma classe (o KNN não permite excluir exemplos individuais).
    const reconstruirClassificador = useCallback(function (classesAtuais) {
        try { if (knnRef.current) knnRef.current.dispose() } catch (e) { /* ignore */ }
        knnRef.current = knnClassifier.create()
        const ids = new Set(classesAtuais.map(function (c) { return c.id }))
        for (const ex of exemplosRef.current) {
            if (ids.has(ex.classeId)) {
                knnRef.current.addExample(tf.tensor1d(ex.vector), ex.classeId)
            }
        }
    }, [])

    const adicionarClasse = useCallback(function (nome) {
        const novaLimpa = String(nome || "").trim() || "Classe " + (classes.length + 1)
        setClasses(function (atual) {
            return atual.concat([{ id: proximoId, nome: novaLimpa }])
        })
        proximoId++
    }, [classes.length])

    const renomearClasse = useCallback(function (id, nome) {
        setClasses(function (atual) {
            return atual.map(function (c) {
                return c.id === id ? { ...c, nome: String(nome || "").trim() || c.nome } : c
            })
        })
    }, [])

    const removerClasse = useCallback(function (id) {
        const proximas = classes.filter(function (c) { return c.id !== id })
        exemplosRef.current = exemplosRef.current.filter(function (ex) { return ex.classeId !== id })
        reconstruirClassificador(proximas)
        setClasses(proximas)
        tocarContagens()
    }, [classes, reconstruirClassificador])

    // Adiciona um exemplo (vetor de features) à classe indicada.
    const adicionarExemplo = useCallback(async function (elemento, classeId) {
        if (!mobilenetRef.current) return false
        const embed = mobilenetRef.current.infer(elemento, true)
        try {
            const vector = Array.from(await embed.data())
            exemplosRef.current.push({ classeId: classeId, vector: vector })
            if (!knnRef.current) knnRef.current = knnClassifier.create()
            knnRef.current.addExample(tf.tensor1d(vector), classeId)
            tocarContagens()
            return true
        } finally {
            try { if (embed) embed.dispose() } catch (e) { /* ignore */ }
        }
    }, [])

    // Adiciona vários exemplos a partir de arquivos de imagem selecionados.
    const adicionarExemplosDeArquivos = useCallback(async function (files, classeId) {
        let qtd = 0
        for (const file of Array.from(files || [])) {
            try {
                const img = await carregarImagem(file)
                const ok = await adicionarExemplo(img, classeId)
                if (ok) { qtd++ }
            } catch (e) {
                // arquivo inválido: ignora
            }
        }
        return qtd
    }, [adicionarExemplo])

    const contagens = useMemo(function () {
        const mapa = {}
        for (const ex of exemplosRef.current) {
            mapa[ex.classeId] = (mapa[ex.classeId] || 0) + 1
        }
        return mapa
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick])

    // Salva o modelo atual no servidor via multipart (dataset.json).
    const salvarModelo = useCallback(async function (nome, descricao) {
        if (!knnRef.current || classes.length === 0) {
            throw new Error("Adicione ao menos uma classe com exemplos antes de salvar.")
        }
        const payload = await montarPayloadKNN(classes, knnRef.current)
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
        const form = new FormData()
        form.append("dataset", blob, "dataset.json")
        form.append("nome", String(nome || "").trim())
        form.append("descricao", String(descricao || "").trim())
        const res = await authFetch(`${API_URL}/ai/models/knn`, { method: "POST", body: form })
        if (!res) throw new Error("Sessão expirada. Faça login novamente.")
        if (!res.ok) {
            const corpo = await res.json().catch(function () { return {} })
            throw new Error(corpo.message || "Falha ao salvar o modelo")
        }
        return (await res.json()).message || "Modelo salvo"
    }, [classes])

    return {
        status, erroMsg,
        classes, adicionarClasse, renomearClasse, removerClasse,
        adicionarExemplo, adicionarExemplosDeArquivos, contagens, salvarModelo,
    }
}

// Carrega um File como HTMLImageElement (resolvida no onload).
function carregarImagem(file, maxLado = 900) {
    return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = function () {
            try {
                // Redimensiona imagens muito grandes antes de extrair features.
                if (img.naturalWidth > maxLado || img.naturalHeight > maxLado) {
                    const canvas = document.createElement("canvas")
                    const scale = maxLado / Math.max(img.naturalWidth, img.naturalHeight)
                    canvas.width = Math.round(img.naturalWidth * scale)
                    canvas.height = Math.round(img.naturalHeight * scale)
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
                    URL.revokeObjectURL(url)
                    resolve(canvas)
                } else {
                    URL.revokeObjectURL(url)
                    resolve(img)
                }
            } catch (e) {
                URL.revokeObjectURL(url)
                reject(e)
            }
        }
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Imagem inválida")) }
        img.src = url
    })
}