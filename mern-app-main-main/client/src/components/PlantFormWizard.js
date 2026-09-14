import React, { useState, useEffect, useRef, useMemo } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import mapeamentoColecoes from "../mapeamentoColecoes"
import { decodeId } from "../idCodec"

import sortPorNome from "../sortOptions"

const BASE_STEPS = [
    { key: "basicos", label: "Dados Básicos", icon: "🌱" },
    { key: "botanica-ambiente", label: "Botânica e Ambiente", icon: "🌿" },
    { key: "taxonomia", label: "Taxonomia", icon: "🧬" },
    { key: "fisicas", label: "Física", icon: "🍂" },
    { key: "cuidados", label: "Cuidados", icon: "🤲" },
    { key: "poda-pragas", label: "Poda e Pragas", icon: "✂️" },
    { key: "cultivo", label: "Cultivo", icon: "🌾" },
]

const REVIEW_STEP = { key: "revisao", label: "Revisão", icon: "✅" }

const AUTOSAVE_DELAY = 3000

const INITIAL_FORM = {
    name: "", scientificName: "", description: "", simpleDescription: "",
    fruit: "", origin: "", type: "", propagation: "", toxicity: "", dificulty: "",
    Filo: "", Classe: "", Ordem: "", Family: "", Genero: "", Especie: "",
    height: "", flowercolor: "", foliage: "", flowering: "",
    light: "", water: "", size: "", soil: "",
    watering: "", fertilizing: "", pruning: "", pests: "",
    manha: "", amount: "", frequency: "", NPK: "", season: "", tools: "", prevention: "", monitoring: "",
    planting: "", exhibition: "", maintenance: "",
    station: "", spacing: "", iluminosity: "", protection: "", idealTemperature: "", tolerance: "",
    imagesPath: [], imagePath: "",
}

const TEXT_LIMITS = {
    simpleDescription: 200,
    description: 2000,
    watering: 500,
    fertilizing: 500,
    pruning: 500,
    pests: 500,
    planting: 500,
    exhibition: 500,
    maintenance: 500,
}

const REVIEW_GRUPOS = [
    {
        label: "🌿 Botânica e Ambiente",
        campos: [
            ["origin", "Origem"], ["toxicity", "Toxicidade"], ["dificulty", "Dificuldade"],
            ["fruit", "Tipo de Fruto"],
            ["light", "Luz"], ["water", "Água"], ["soil", "Solo"],
        ],
    },
    {
        label: "🧬 Taxonomia",
        campos: [
            ["Filo", "Filo"], ["Classe", "Classe"], ["Ordem", "Ordem"],
            ["Family", "Família"], ["Genero", "Gênero"], ["Especie", "Espécie"],
        ],
    },
    {
        label: "🍂 Características Físicas",
        campos: [
            ["type", "Tipo"], ["height", "Altura/Porte"], ["flowercolor", "Cor da Flor"],
            ["foliage", "Folhagem"], ["flowering", "Floração"], ["size", "Tamanho"],
        ],
    },
    {
        label: "🤲 Cuidados",
        campos: [
            ["watering", "Rega"], ["manha", "Melhor Horário"], ["amount", "Quantidade"],
            ["fertilizing", "Adubação"], ["frequency", "Freq. Adubação"], ["NPK", "NPK"],
        ],
    },
    {
        label: "✂️ Poda e Pragas",
        campos: [
            ["pruning", "Poda"], ["season", "Época da Poda"], ["tools", "Ferramentas"],
            ["pests", "Pragas e Doenças"], ["prevention", "Prevenção"], ["monitoring", "Monitoramento"],
        ],
    },
    {
        label: "🌾 Cultivo",
        campos: [
            ["planting", "Plantio"], ["propagation", "Propagação"], ["station", "Estação"], ["spacing", "Espaçamento"],
            ["exhibition", "Exposição"], ["iluminosity", "Horas de Sol"], ["protection", "Proteção"],
            ["maintenance", "Manutenção"], ["idealTemperature", "Temperatura Ideal"], ["tolerance", "Tolerância"],
        ],
    },
]

export async function loadCollectionOptions(setOpcoesBanco) {
    try {
        const res = await fetch(`${API_URL}/collections/all`)
        if (res.ok) {
            const all = await res.json()
            const mapped = {}
            for (const [key, meta] of Object.entries(mapeamentoColecoes)) {
                mapped[key] = sortPorNome(all[meta.colecao] || [], key)
            }
            setOpcoesBanco(mapped)
        }
    } catch (err) {
        console.error("Erro ao carregar coleções:", err)
    }
}

function FieldLabel({ children, optional }) {
    return (
        <label className="wizard-label">
            {children}
            {optional && <span className="wizard-label__optional">opcional</span>}
        </label>
    )
}

function CharacterCounter({ value, max }) {
    return (
        <small className={`wizard-counter ${value.length > max ? "wizard-counter--over" : ""}`}>
            {value.length}/{max}
        </small>
    )
}

function conjuntoPreenchido(campos, form) {
    return campos.filter(k => form[k] && String(form[k]).trim()).length
}

function FieldGroup({ id, icon, title, optional, filled, total, hint, children }) {
    return (
        <div className="wizard-group">
            <div className="wizard-group__head">
                <span className="wizard-group__title">
                    <span className="wizard-group__icon">{icon}</span>
                    {title}
                    {optional && <span className="wizard-tag-optional">opcional</span>}
                </span>
                <span className="wizard-group__meta">{filled}/{total} preenchidos</span>
            </div>
            <div className="wizard-group__body">
                {hint && <p className="wizard-group__hint">{hint}</p>}
                <div className="row">{children}</div>
            </div>
        </div>
    )
}

function PlantImageDropZone({ mode, imageFiles, setImageFiles, existingImages, setExistingImages }) {
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef()
    const objectUrls = useRef([])

    useEffect(() => {
        objectUrls.current = imageFiles.map(f => URL.createObjectURL(f))
        return () => {
            objectUrls.current.forEach(url => URL.revokeObjectURL(url))
            objectUrls.current = []
        }
    }, [imageFiles])

    function addFiles(newFiles) {
        setImageFiles(prev => {
            const merged = [...prev]
            for (const file of newFiles) {
                if (merged.length + existingImages.length >= 5) break
                if (!merged.some(f => f.name === file.name && f.size === file.size)) {
                    merged.push(file)
                }
            }
            return merged
        })
    }

    function handleDrop(e) {
        e.preventDefault()
        setDragging(false)
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
        addFiles(files)
    }

    function handleInput(e) {
        addFiles(Array.from(e.target.files))
        e.target.value = null
    }

    const totalImages = existingImages.length + imageFiles.length
    const showDropzone = mode === "edit" ? totalImages < 5 : true

    return (
        <div className="wizard-dropzone-wrapper">
            {existingImages.length > 0 && (
                <div className="wizard-dropzone__previews mb-2">
                    {existingImages.map((path, i) => (
                        <div key={`exist-${i}`} className="wizard-dropzone__thumb">
                            <img src={`${API_URL}${path}`} alt={`Existente ${i + 1}`} />
                            <button
                                type="button"
                                className="wizard-dropzone__remove"
                                onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                                aria-label="Remover imagem existente"
                            >
                                ×
                            </button>
                            <span className="wizard-dropzone__order">{i + 1}</span>
                        </div>
                    ))}
                </div>
            )}
            {showDropzone && (
                <div
                    className={`wizard-dropzone ${dragging ? "wizard-dropzone--active" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            inputRef.current?.click()
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Adicionar imagens da planta"
                >
                    <span className="wizard-dropzone__icon">📷</span>
                    <span className="wizard-dropzone__text">
                        Arraste imagens aqui ou <strong>clique para selecionar</strong>
                    </span>
                    <span className="wizard-dropzone__hint">
                        {mode === "edit" ? `${5 - totalImages} vaga(s) restante(s)` : "Até 5 imagens (JPG, PNG)"}
                    </span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleInput}
                        className="d-none"
                    />
                </div>
            )}
            {imageFiles.length > 0 && (
                <div className="wizard-dropzone__previews mt-2">
                    {imageFiles.map((file, i) => (
                        <div key={`new-${i}`} className={`wizard-dropzone__thumb${mode === "edit" ? " wizard-dropzone__thumb--new" : ""}`}>
                            <img src={objectUrls.current[i]} alt={file.name} />
                            <button
                                type="button"
                                className="wizard-dropzone__remove"
                                onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                                aria-label="Remover imagem"
                            >
                                ×
                            </button>
                            <span className="wizard-dropzone__order">
                                {mode === "edit" ? `Nova ${existingImages.length + i + 1}` : i + 1}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function PlantFormWizard({
    mode,
    heading,
    loadingText,
    withReview = false,
    autosaveKey = null,
    cloneParam = null,
    sugestaoParam = null,
    submitLabel,
    submittingLabel,
    onLoad,
    onSubmit,
}) {
    const [form, setForm] = useState(INITIAL_FORM)
    const [imageFiles, setImageFiles] = useState([])
    const [existingImages, setExistingImages] = useState([])
    const [currentStep, setCurrentStep] = useState(0)
    const [opcoesBanco, setOpcoesBanco] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [modalConfig, setModalConfig] = useState({ campoForm: "", colecaoMongo: "", labelAmigavel: "" })
    const [novoValorInput, setNovoValorInput] = useState("")
    const [modalSearch, setModalSearch] = useState("")
    const [toast, setToast] = useState(null)
    const [hasDraft, setHasDraft] = useState(false)
    const [identifyResults, setIdentifyResults] = useState([])
    const [identifyLoading, setIdentifyLoading] = useState(false)
    const [identifyErro, setIdentifyErro] = useState("")
    const [identifyOrgan, setIdentifyOrgan] = useState("auto")
    const [identifyActive, setIdentifyActive] = useState("")
    const [identifyMatch, setIdentifyMatch] = useState(null)
    const [identifyMode, setIdentifyMode] = useState("imagem")
    const [buscarQuery, setBuscarQuery] = useState("")
    const [buscarLoading, setBuscarLoading] = useState(false)
    const [catalogQuery, setCatalogQuery] = useState("")
    const [catalogResults, setCatalogResults] = useState([])
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogSearched, setCatalogSearched] = useState(false)
    const [catalogOpen, setCatalogOpen] = useState(false)
    const autoSaveTimer = useRef(null)

    const steps = withReview ? [...BASE_STEPS, REVIEW_STEP] : BASE_STEPS

    function showToast(message, type = "success") {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    function updateForm(value) {
        setForm(prev => ({ ...prev, ...value }))
    }

    useEffect(() => {
        let active = true
        async function init() {
            setLoading(true)
            try {
                await onLoad({ setForm, setExistingImages, setOpcoesBanco, showToast })
            } finally {
                if (active) setLoading(false)
            }
        }
        init()
        return () => { active = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Clonar planta: busca dados e pré-preenche o formulário
    useEffect(() => {
        if (!cloneParam) return
        const realId = decodeId(cloneParam)
        if (!realId) return
        async function loadClone() {
            try {
                const res = await authFetch(`${API_URL}/plant/${realId}/clone`)
                if (!res) {
                    showToast("Sessão expirada. Faça login novamente.", "error")
                    return
                }
                if (!res.ok) {
                    showToast("Erro ao buscar planta para clonar.", "error")
                    return
                }
                const data = await res.json()
                setForm(prev => ({ ...prev, ...data, name: "", scientificName: "" }))
                showToast("Planta clonada! Ajuste nome e científico antes de salvar.")
            } catch {
                showToast("Erro ao conectar ao servidor para clonar.", "error")
            }
        }
        loadClone()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cloneParam])

    // Criar a partir de sugestão (moderação): pré-preenche com os dados da sugestão
    useEffect(() => {
        if (!sugestaoParam) return
        async function loadSugestao() {
            try {
                const res = await authFetch(`${API_URL}/suggestions/${sugestaoParam}`)
                if (!res) {
                    showToast("Sessão expirada. Faça login novamente.", "error")
                    return
                }
                if (!res.ok) {
                    showToast("Erro ao carregar a sugestão.", "error")
                    return
                }
                const sug = await res.json()
                const data = sug.data || {}
                const preenchidos = {}
                for (const campo of ["name", "scientificName", "simpleDescription", "description", "origin", "type", "Family", "Genero", "Especie"]) {
                    if (data[campo] !== undefined && data[campo] !== null) {
                        preenchidos[campo] = data[campo]
                    }
                }
                setForm(prev => ({ ...prev, ...preenchidos }))
                showToast(`Formulário preenchido com os dados da sugestão de ${sug.userName || "um usuário"}.`)
            } catch {
                showToast("Erro ao conectar ao servidor para carregar a sugestão.", "error")
            }
        }
        loadSugestao()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sugestaoParam])

    // Restore draft on mount
    useEffect(() => {
        if (!autosaveKey || sugestaoParam) return
        try {
            const saved = localStorage.getItem(autosaveKey)
            if (saved) {
                const draft = JSON.parse(saved)
                if (draft?.form?.name) {
                    setForm(draft.form)
                    setCurrentStep(draft.currentStep || 0)
                    setHasDraft(true)
                }
            }
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-save to localStorage
    useEffect(() => {
        if (loading || !autosaveKey || sugestaoParam) return
        clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = setTimeout(() => {
            const draft = { form, imageNames: imageFiles.map(f => f.name), currentStep }
            localStorage.setItem(autosaveKey, JSON.stringify(draft))
        }, AUTOSAVE_DELAY)
        return () => clearTimeout(autoSaveTimer.current)
    }, [form, imageFiles, currentStep, loading, autosaveKey, sugestaoParam])

    function clearDraft() {
        if (!autosaveKey) return
        localStorage.removeItem(autosaveKey)
        setForm(INITIAL_FORM)
        setImageFiles([])
        setExistingImages([])
        setCurrentStep(0)
        setHasDraft(false)
        showToast("Rascunho limpo!")
    }

    // Retorna a imagem a ser enviada para identificação: prioriza um arquivo
    // novo recém-selecionado; senão, busca a primeira imagem já cadastrada.
    async function imagemParaIdentificacao() {
        if (imageFiles.length > 0) return imageFiles[0]
        if (existingImages.length > 0) {
            const res = await fetch(`${API_URL}${existingImages[0]}`)
            if (!res.ok) return null
            return new File([await res.blob()], "imagem.jpg", {
                type: res.headers.get("content-type") || "image/jpeg",
            })
        }
        return null
    }

    async function identificarPlanta() {
        if (identifyLoading) return
        let imagem
        try {
            imagem = await imagemParaIdentificacao()
        } catch {
            imagem = null
        }
        if (!imagem) {
            showToast("Adicione uma imagem da planta primeiro.", "error")
            return
        }
        setIdentifyLoading(true)
        setIdentifyErro("")
        setIdentifyResults([])
        setIdentifyActive("")
        setIdentifyMatch(null)
        try {
            const formData = new FormData()
            formData.append("image", imagem)
            formData.append("organ", identifyOrgan)
            const response = await authFetch(`${API_URL}/identify`, {
                method: "POST",
                body: formData,
            })
            if (!response) {
                showToast("Sessão expirada. Faça login novamente.", "error")
                return
            }
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                setIdentifyErro(err.mensagem || "Não foi possível identificar a planta.")
                return
            }
            const data = await response.json()
            setIdentifyResults(data.resultados || [])
            if (data.aviso) setIdentifyErro(data.aviso)
        } catch {
            setIdentifyErro("Erro ao conectar ao servidor.")
        } finally {
            setIdentifyLoading(false)
        }
    }

    // Busca a espécie pelo nome popular ou científico no Pl@ntNet (sem imagem).
    async function buscarPorNome() {
        const termo = buscarQuery.trim()
        if (!termo || buscarLoading) return
        setBuscarLoading(true)
        setIdentifyErro("")
        setIdentifyResults([])
        setIdentifyActive("")
        setIdentifyMatch(null)
        try {
            const response = await authFetch(`${API_URL}/identify/buscar?nome=${encodeURIComponent(termo)}`)
            if (!response) {
                showToast("Sessão expirada. Faça login novamente.", "error")
                return
            }
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                setIdentifyErro(err.mensagem || "Não foi possível buscar a planta.")
                return
            }
            const data = await response.json()
            setIdentifyResults(data.resultados || [])
            if (data.aviso) setIdentifyErro(data.aviso)
        } catch {
            setIdentifyErro("Erro ao conectar ao servidor.")
        } finally {
            setBuscarLoading(false)
        }
    }

    // Converte valores retornados pela identificação em _ids de campos select:
    // casa com um item já cadastrado na coleção ou cria o item automaticamente.
    async function resolverSelecoes(valores) {
        const resolvidos = {}
        for (const campo of Object.keys(valores)) {
            const config = mapeamentoColecoes[campo]
            const valor = String(valores[campo] || "").trim()
            if (!config || !valor) continue
            const normalizado = valor.toLowerCase()
            const existente = (opcoesBanco[campo] || []).find(o => String(o.name || "").trim().toLowerCase() === normalizado)
            if (existente) {
                resolvidos[campo] = existente._id
                continue
            }
            try {
                const response = await authFetch(`${API_URL}/collections/${config.colecao}/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: valor })
                })
                if (!response || !response.ok) continue
                const item = await response.json()
                setOpcoesBanco(prev => ({
                    ...prev,
                    [campo]: sortPorNome([...(prev[campo] || []), item], campo)
                }))
                resolvidos[campo] = item._id
            } catch {
                // Falha de rede: mantém o valor original sem resolver.
            }
        }
        return resolvidos
    }

    // Busca planta(s) no catálogo pelo nome popular ou científico.
    async function buscarPlantaPorNome(nome) {
        if (!nome) return []
        try {
            const res = await authFetch(`${API_URL}/plant?search=${encodeURIComponent(nome)}`)
            if (!res || !res.ok) return []
            const lista = await res.json()
            return Array.isArray(lista) ? lista : []
        } catch {
            return []
        }
    }

    // Copia os dados completos de uma planta cadastrada, sem sobrescrever
    // identidade (nome/científico), taxonomia ou imagens.
    async function preencherDoAcervo(plantId) {
        if (!plantId) return
        try {
            const res = await authFetch(`${API_URL}/plant/${plantId}/clone`)
            if (!res) {
                showToast("Sessão expirada. Faça login novamente.", "error")
                return
            }
            if (!res.ok) {
                showToast("Erro ao buscar a planta do catálogo.", "error")
                return
            }
            const data = await res.json()
            const ignorados = new Set(["name", "scientificName", "Filo", "Classe", "Ordem", "Family", "Genero", "Especie", "imagesPath", "imagePath", "imagesMeta"])
            const aplicar = {}
            for (const [k, v] of Object.entries(data)) {
                if (ignorados.has(k)) continue
                aplicar[k] = v ?? ""
            }
            setForm(prev => ({ ...prev, ...aplicar }))
            showToast("Dados copiados da planta cadastrada. Revise antes de salvar.")
        } catch {
            showToast("Erro ao conectar ao servidor.", "error")
        }
    }

    async function buscarNoCatalogo() {
        if (!catalogQuery.trim() || catalogLoading) return
        setCatalogLoading(true)
        setCatalogSearched(true)
        setCatalogResults(await buscarPlantaPorNome(catalogQuery.trim()))
        setCatalogLoading(false)
    }

    function usarDadosCadastrados(plantId) {
        preencherDoAcervo(plantId)
    }

    async function aplicarIdentificacao(r) {
        setIdentifyActive(r.scientificName)
        const preencher = {}
        if (r.nomePopular) preencher.name = r.nomePopular
        if (r.scientificName) preencher.scientificName = r.scientificName
        if (r.family) preencher.Family = r.family
        if (r.genus) preencher.Genero = r.genus
        if (r.species) preencher.Especie = r.species
        if (r.filo) preencher.Filo = r.filo
        if (r.classe) preencher.Classe = r.classe
        if (r.ordem) preencher.Ordem = r.ordem
        Object.assign(preencher, await resolverSelecoes(preencher))
        updateForm(preencher)

        const achar = await buscarPlantaPorNome(r.scientificName)
        setIdentifyMatch(achar.length ? { scientificName: r.scientificName, planta: achar[0] } : null)

        const faltantes = Array.isArray(r.faltantes) ? r.faltantes : []
        showToast(
            faltantes.length > 0
                ? `Campos preenchidos pela identificação. Sem resposta: ${faltantes.join(", ")}.`
                : "Campos de taxonomia preenchidos pela identificação."
        )
    }

    function abrirModalPara(campo) {
        setModalConfig({
            campoForm: campo,
            colecaoMongo: mapeamentoColecoes[campo].colecao,
            labelAmigavel: mapeamentoColecoes[campo].label
        })
        setNovoValorInput("")
        setModalSearch("")
    }

    async function salvarNovoItem() {
        if (!novoValorInput.trim()) return
        try {
            const response = await authFetch(`${API_URL}/collections/${modalConfig.colecaoMongo}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: novoValorInput })
            })
            if (!response || !response.ok) {
                const err = response ? await response.json().catch(() => ({})) : {}
                showToast(err.message || "Erro ao salvar", "error")
                return
            }
            const item = await response.json()
            setOpcoesBanco(prev => ({
                ...prev,
                [modalConfig.campoForm]: sortPorNome([...(prev[modalConfig.campoForm] || []), item], modalConfig.campoForm)
            }))
            updateForm({ [modalConfig.campoForm]: item._id })
            setNovoValorInput("")
            showToast(`"${item.name}" adicionado!`)
            const btn = document.querySelector('#modalDinamico [data-bs-dismiss="modal"]')
            if (btn) btn.click()
        } catch {
            showToast("Erro ao conectar ao servidor", "error")
        }
    }

    async function deletarItemDoCampo(campo, idItem) {
        const colecaoMongo = mapeamentoColecoes[campo].colecao
        const nomeItem = (opcoesBanco[campo] || []).find(item => item._id === idItem)?.name || "este valor"
        if (!window.confirm(`Excluir "${nomeItem}" do banco de dados?\nEssa ação não pode ser desfeita.`)) return
        try {
            const response = await authFetch(`${API_URL}/collections/${colecaoMongo}/${idItem}`, { method: "DELETE" })
            if (response === null) {
                showToast("Sessão expirada. Faça login novamente.", "error")
                return
            }
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                showToast(err.message || "Erro ao excluir", "error")
                return
            }
            setOpcoesBanco(prev => ({
                ...prev,
                [campo]: (prev[campo] || []).filter(item => item._id !== idItem)
            }))
            if (form[campo] === idItem) {
                updateForm({ [campo]: "" })
            }
            showToast("Item removido!")
        } catch {
            showToast("Erro ao conectar ao servidor", "error")
        }
    }

    function deletarItem(idItem) {
        return deletarItemDoCampo(modalConfig.campoForm, idItem)
    }

    function buildFormData() {
        const formData = new FormData()
        if (mode === "edit") {
            Object.keys(form).forEach(key => {
                if (key === "imagesPath") {
                    existingImages.forEach(path => formData.append("imagesPath", path))
                } else if (key === "imagesMeta") {
                    const mantidas = Array.isArray(form.imagesMeta)
                        ? form.imagesMeta.filter(m => m && (typeof m.path === "string" || typeof m.webpPath === "string") && existingImages.includes(m.path || m.webpPath))
                        : []
                    formData.append("imagesMeta", JSON.stringify(mantidas))
                } else {
                    formData.append(key, form[key])
                }
            })
        } else {
            Object.keys(form).forEach(key => {
                if (key === "imagesPath" || key === "imagePath") return
                formData.append(key, form[key])
            })
        }
        imageFiles.forEach(file => formData.append("images", file))
        return formData
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)
        Promise.resolve(onSubmit({ formData: buildFormData(), showToast })).finally(() => setSubmitting(false))
    }

    function Field(campo, placeholder) {
        const opcoes = opcoesBanco[campo] || []
        return (
            <div className="wizard-select-group">
                <select
                    className="form-select"
                    value={form[campo] || ""}
                    onChange={e => updateForm({ [campo]: e.target.value })}
                    aria-label={placeholder}
                >
                    <option value="">{placeholder}…</option>
                    {opcoes.length === 0 && (
                        <option value="" disabled>— sem opções, use o + para adicionar —</option>
                    )}
                    {opcoes.map(o => (
                        <option key={o._id} value={o._id}>{o.name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    className="wizard-select-plus"
                    onClick={() => abrirModalPara(campo)}
                    title="Gerenciar valores"
                >
                    +
                </button>
            </div>
        )
    }

    function CampoSelect(campo, label, placeholder) {
        return (
            <div className="mb-3">
                <FieldLabel>{label}</FieldLabel>
                {Field(campo, placeholder)}
            </div>
        )
    }

    function CampoTex(campo, label, placeholder) {
        const max = TEXT_LIMITS[campo]
        return (
            <div className="col-md-8 mb-3">
                <FieldLabel>{label}</FieldLabel>
                <div className="wizard-textarea">
                    <textarea
                        className="form-control"
                        rows="2"
                        maxLength={max}
                        placeholder={placeholder}
                        value={form[campo] || ""}
                        onChange={e => updateForm({ [campo]: e.target.value })}
                    />
                    <CharacterCounter value={form[campo] || ""} max={max} />
                </div>
            </div>
        )
    }

    function ColunaSelects(campos) {
        return (
            <div className="col-md-4 mb-3">
                {campos.map(([campo, label, placeholder]) => (
                    <div key={campo}>{CampoSelect(campo, label, placeholder)}</div>
                ))}
            </div>
        )
    }

    const isLastStep = currentStep === steps.length - 1
    const canGoBack = currentStep > 0
    const canAdvance = currentStep < steps.length - 1

    // URL estável para o preview da primeira imagem (evita vazamento de memória)
    const previewUrl = useMemo(() => {
        if (imageFiles.length === 0) return null
        return URL.createObjectURL(imageFiles[0])
    }, [imageFiles])
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
    }, [previewUrl])

    if (loading) {
        return (
            <div className="admin-page admin-page--plant-form container mt-4">
                <div className="wizard-loading">
                    <div className="spinner-border" role="status" />
                    <p>{loadingText}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-page admin-page--plant-form container mt-4">
            {toast && (
                <div className={`wizard-toast wizard-toast--${toast.type}`}>
                    {toast.type === "success" ? "✓" : "✕"} {toast.message}
                </div>
            )}

            <div className="wizard-header">
                <h3 className="admin-page__title">{typeof heading === "function" ? heading(form) : heading}</h3>
                {autosaveKey && hasDraft && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearDraft}>
                        Limpar rascunho
                    </button>
                )}
            </div>

            {/* ── STEPPER ── */}
            <div className="wizard-stepper">
                {steps.map((step, i) => (
                    <button
                        key={step.key}
                        type="button"
                        className={`wizard-stepper__step ${i === currentStep ? "wizard-stepper__step--active" : ""} ${i < currentStep ? "wizard-stepper__step--done" : ""}`}
                        onClick={() => setCurrentStep(i)}
                    >
                        <span className="wizard-stepper__number">
                            {i < currentStep ? "✓" : step.icon}
                        </span>
                        <span className="wizard-stepper__label">{step.label}</span>
                    </button>
                ))}
                <div className="wizard-stepper__track">
                    <div
                        className="wizard-stepper__progress"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                </div>
            </div>

            <form className="plant-admin-form wizard-form" onSubmit={handleSubmit}>
                {/* ── STEP 0: DADOS BÁSICOS ── */}
                {currentStep === 0 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🌱 Dados Básicos</h4>
                            <p>Nome, imagem e descrição da planta</p>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Popular</label>
                                <input
                                    type="text"
                                    className={`form-control ${!form.name ? "is-invalid-mild" : ""}`}
                                    placeholder="Ex: Espada-de-São-Jorge"
                                    value={form.name}
                                    onChange={e => updateForm({ name: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Científico</label>
                                <input
                                    type="text"
                                    className={`form-control ${!form.scientificName ? "is-invalid-mild" : ""}`}
                                    placeholder="Ex: Acorus calamus"
                                    value={form.scientificName}
                                    onChange={e => updateForm({ scientificName: e.target.value })}
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <button
                                    type="button"
                                    className={`wizard-catalog__toggle${catalogOpen ? " is-open" : ""}`}
                                    onClick={() => setCatalogOpen(o => !o)}
                                >
                                    <span>📚 Usar dados de uma planta já cadastrada</span>
                                    <span className="wizard-catalog__chevron">{catalogOpen ? "▲" : "▼"}</span>
                                </button>
                                {catalogOpen && (
                                    <div className="wizard-catalog mt-2">
                                        <div className="d-flex gap-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Buscar por nome popular ou científico..."
                                                value={catalogQuery}
                                                onChange={e => setCatalogQuery(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && buscarNoCatalogo()}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary text-nowrap"
                                                onClick={buscarNoCatalogo}
                                                disabled={catalogLoading || !catalogQuery.trim()}
                                            >
                                                {catalogLoading ? "Buscando..." : "Buscar"}
                                            </button>
                                        </div>
                                        {catalogResults.length > 0 && (
                                            <ul className="wizard-catalog__list">
                                                {catalogResults.map(p => (
                                                    <li key={p._id}>
                                                        <span className="fw-semibold">{p.name || "—"}</span>
                                                        <em>{p.scientificName || "sem nome científico"}</em>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => usarDadosCadastrados(p._id)}
                                                        >
                                                            Usar dados
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {catalogSearched && catalogResults.length === 0 && (
                                            <p className="text-muted small mt-2">Nenhuma planta encontrada no catálogo.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="col-12 mb-3">
                                <FieldLabel>Imagens</FieldLabel>
                                <PlantImageDropZone
                                    mode={mode}
                                    imageFiles={imageFiles}
                                    setImageFiles={setImageFiles}
                                    existingImages={existingImages}
                                    setExistingImages={setExistingImages}
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="wizard-identify">
                                    <div className="wizard-identify__head">
                                        <div>
                                            <div className="wizard-identify__title">🔍 Identificar com Pl@ntNet</div>
                                            <div className="wizard-identify__hint">
                                                Identifique por foto ou busque pelo nome para preencher a taxonomia automaticamente.
                                            </div>
                                        </div>
                                        <div className="wizard-identify__tabs" role="tablist">
                                            <button
                                                type="button"
                                                role="tab"
                                                className={`wizard-identify__tab${identifyMode === "imagem" ? " is-active" : ""}`}
                                                onClick={() => setIdentifyMode("imagem")}
                                            >
                                                🖼️ Por imagem
                                            </button>
                                            <button
                                                type="button"
                                                role="tab"
                                                className={`wizard-identify__tab${identifyMode === "nome" ? " is-active" : ""}`}
                                                onClick={() => setIdentifyMode("nome")}
                                            >
                                                🔤 Por nome
                                            </button>
                                        </div>
                                    </div>

                                    {identifyMode === "imagem" ? (
                                        <div className="d-flex gap-2 flex-wrap wizard-identify__controles">
                                            <select
                                                className="form-select form-select-sm wizard-identify__select"
                                                value={identifyOrgan}
                                                onChange={e => setIdentifyOrgan(e.target.value)}
                                                aria-label="Órgão da planta na imagem"
                                            >
                                                <option value="auto">Auto-detectar</option>
                                                <option value="leaf">Folha</option>
                                                <option value="flower">Flor</option>
                                                <option value="fruit">Fruto</option>
                                                <option value="bark">Caule / Casca</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary wizard-identify__btn"
                                                onClick={identificarPlanta}
                                                disabled={identifyLoading || (imageFiles.length === 0 && existingImages.length === 0)}
                                            >
                                                {identifyLoading ? (
                                                    <><span className="spinner-border spinner-border-sm me-2" />Identificando...</>
                                                ) : "Identificar planta"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="d-flex gap-2 flex-wrap wizard-identify__controles">
                                            <input
                                                type="text"
                                                className="form-control wizard-identify__busca"
                                                placeholder="Ex: Espada-de-São-Jorge ou Dracaena trifasciata..."
                                                value={buscarQuery}
                                                onChange={e => setBuscarQuery(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && buscarPorNome()}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary wizard-identify__btn text-nowrap"
                                                onClick={buscarPorNome}
                                                disabled={buscarLoading || !buscarQuery.trim()}
                                            >
                                                {buscarLoading ? (
                                                    <><span className="spinner-border spinner-border-sm me-2" />Buscando...</>
                                                ) : "Buscar"}
                                            </button>
                                        </div>
                                    )}

                                    {identifyErro && (
                                        <div className="wizard-identify__erro">{identifyErro}</div>
                                    )}

                                    {identifyResults.length > 0 && (
                                        <div className="wizard-identify__results">
                                            {identifyResults.map((r, i) => {
                                                const pct = r.score != null ? Math.round(r.score * 100) : null
                                                const ativo = identifyActive === r.scientificName
                                                return (
                                                    <button
                                                        key={`${r.scientificName}-${i}`}
                                                        type="button"
                                                        className={`wizard-identify__result${ativo ? " is-active" : ""}`}
                                                        onClick={() => aplicarIdentificacao(r)}
                                                    >
                                                        <div className="wizard-identify__result-topo">
                                                            <span className="wizard-identify__nome">{r.scientificName}</span>
                                                            {pct != null && <span className="wizard-identify__pct">{pct}%</span>}
                                                        </div>
                                                        {pct != null && (
                                                            <div className="wizard-identify__score">
                                                                <span className="wizard-identify__score-bar" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        )}
                                                        <div className="wizard-identify__meta">
                                                            {r.nomePopular && <span>{r.nomePopular}</span>}
                                                            {r.family && <span>Família: {r.family}</span>}
                                                            {(r.filo || r.classe || r.ordem) && (
                                                                <span className="text-muted">
                                                                    {[r.filo, r.classe, r.ordem].filter(Boolean).join(" · ")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {Array.isArray(r.faltantes) && r.faltantes.length > 0 && (
                                                            <div className="wizard-identify__faltantes">
                                                                Não retornado: {r.faltantes.join(", ")}
                                                            </div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                            <div className="wizard-identify__hint">
                                                Clique em um resultado para preencher o formulário.
                                            </div>
                                        </div>
                                    )}
                                    {identifyMatch && (
                                        <div className="wizard-identify__match">
                                            <span>
                                                Já cadastrada: <strong>{identifyMatch.planta.name || "—"}</strong>{" "}
                                                (<em>{identifyMatch.planta.scientificName}</em>)
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary text-nowrap"
                                                onClick={() => usarDadosCadastrados(identifyMatch.planta._id)}
                                            >
                                                Usar dados completos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-12 mb-3">
                                <FieldLabel>Resumo Rápido</FieldLabel>
                                <div className="wizard-textarea">
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        maxLength={TEXT_LIMITS.simpleDescription}
                                        placeholder="Uma frase curta sobre a planta..."
                                        value={form.simpleDescription}
                                        onChange={e => updateForm({ simpleDescription: e.target.value })}
                                    />
                                    <CharacterCounter value={form.simpleDescription || ""} max={TEXT_LIMITS.simpleDescription} />
                                </div>
                            </div>
                            <div className="col-12 mb-3">
                                <FieldLabel>Descrição Detalhada</FieldLabel>
                                <div className="wizard-textarea">
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        maxLength={TEXT_LIMITS.description}
                                        placeholder="Descrição completa da planta, suas características, usos..."
                                        value={form.description}
                                        onChange={e => updateForm({ description: e.target.value })}
                                    />
                                    <CharacterCounter value={form.description || ""} max={TEXT_LIMITS.description} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: BOTÂNICA E AMBIENTE ── */}
                {currentStep === 1 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🌿 Botânica e Ambiente</h4>
                            <p>Origem, toxicidade e condições básicas</p>
                        </div>
                        <FieldGroup
                            id="s1-botanica"
                            icon="🌿"
                            title="Botânica"
                            optional
                            filled={conjuntoPreenchido(["origin", "toxicity", "dificulty", "fruit"], form)}
                            total={4}
                        >
                            <div className="col-md-3 mb-3">
                                <FieldLabel>Origem</FieldLabel>
                                { Field("origin", "Origem geográfica...") }
                            </div>
                            <div className="col-md-3 mb-3">
                                <FieldLabel>Toxicidade</FieldLabel>
                                { Field("toxicity", "Grau de toxicidade...") }
                            </div>
                            <div className="col-md-3 mb-3">
                                <FieldLabel>Dificuldade</FieldLabel>
                                { Field("dificulty", "Nível de cuidado...") }
                            </div>
                            <div className="col-md-3 mb-3">
                                <FieldLabel>Tipo de Fruto</FieldLabel>
                                { Field("fruit", "Tipo de fruto...") }
                            </div>
                        </FieldGroup>
                        <FieldGroup
                            id="s1-ambiente"
                            icon="☀️"
                            title="Necessidades Ambientais"
                            optional
                            filled={conjuntoPreenchido(["light", "water", "soil"], form)}
                            total={3}
                        >
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Luminosidade</FieldLabel>
                                { Field("light", "Necessidade de luz...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Água</FieldLabel>
                                { Field("water", "Necessidade de água...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Solo</FieldLabel>
                                { Field("soil", "Tipo de solo...") }
                            </div>
                        </FieldGroup>
                    </div>
                )}

                {/* ── STEP 2: TAXONOMIA ── */}
                {currentStep === 2 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🧬 Classificação Taxonômica</h4>
                            <p>Preenchido automaticamente pela identificação</p>
                        </div>
                        <FieldGroup
                            id="s2-taxonomia"
                            icon="🧬"
                            title="Classificação Taxonômica"
                            hint="Preenchido automaticamente pela identificação"
                            filled={conjuntoPreenchido(["Filo", "Classe", "Ordem", "Family", "Genero", "Especie"], form)}
                            total={6}
                        >
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Filo</FieldLabel>
                                <input type="text" className="form-control" value={form.Filo} onChange={e => updateForm({ Filo: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Classe</FieldLabel>
                                <input type="text" className="form-control" value={form.Classe} onChange={e => updateForm({ Classe: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Ordem</FieldLabel>
                                <input type="text" className="form-control" value={form.Ordem} onChange={e => updateForm({ Ordem: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Família</FieldLabel>
                                <input type="text" className="form-control" value={form.Family} onChange={e => updateForm({ Family: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Gênero</FieldLabel>
                                <input type="text" className="form-control" value={form.Genero} onChange={e => updateForm({ Genero: e.target.value })} placeholder="Digite e saia do campo" />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Espécie</FieldLabel>
                                <input type="text" className="form-control" value={form.Especie} onChange={e => updateForm({ Especie: e.target.value })} />
                            </div>
                        </FieldGroup>
                    </div>
                )}

                {/* ── STEP 3: CARACTERÍSTICAS FÍSICAS ── */}
                {currentStep === 3 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🍂 Características Físicas</h4>
                            <p>Aparência visual da planta</p>
                        </div>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Tipo</FieldLabel>
                                { Field("type", "Tipo de planta...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Altura / Porte</FieldLabel>
                                { Field("height", "Porte da planta...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Cor da Flor</FieldLabel>
                                { Field("flowercolor", "Cores das flores...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Folhagem</FieldLabel>
                                { Field("foliage", "Tipo de folhagem...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Época de Floração</FieldLabel>
                                { Field("flowering", "Quando floresce...") }
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Tamanho</FieldLabel>
                                { Field("size", "Tamanho da planta...") }
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 4: CUIDADOS ── */}
                {currentStep === 4 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🤲 Cuidados da Planta</h4>
                            <p>Rega e adubação</p>
                        </div>

                        <FieldGroup
                            id="s4-rega"
                            icon="💧"
                            title="Rega"
                            optional
                            filled={conjuntoPreenchido(["watering", "manha", "amount"], form)}
                            total={3}
                        >
                            {CampoTex("watering", "Rega", "Como regar esta planta...")}
                            {ColunaSelects([
                                ["manha", "Melhor Horário", "Horário ideal..."],
                                ["amount", "Quantidade", "Quantidade..."],
                            ])}
                        </FieldGroup>

                        <FieldGroup
                            id="s4-adubacao"
                            icon="🧪"
                            title="Adubação"
                            optional
                            filled={conjuntoPreenchido(["fertilizing", "frequency", "NPK"], form)}
                            total={3}
                        >
                            {CampoTex("fertilizing", "Adubação", "Como adubar esta planta...")}
                            {ColunaSelects([
                                ["frequency", "Frequência de Adubação", "Frequência..."],
                                ["NPK", "Tipo de NPK", "Tipo de NPK..."],
                            ])}
                        </FieldGroup>
                    </div>
                )}

                {/* ── STEP 5: PODA E PRAGAS ── */}
                {currentStep === 5 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>✂️ Poda e Pragas</h4>
                            <p>Poda, pragas e monitoramento</p>
                        </div>

                        <FieldGroup
                            id="s5-poda"
                            icon="✂️"
                            title="Poda"
                            optional
                            filled={conjuntoPreenchido(["pruning", "season", "tools"], form)}
                            total={3}
                        >
                            {CampoTex("pruning", "Poda", "Como podar...")}
                            {ColunaSelects([
                                ["season", "Época", "Época da poda..."],
                                ["tools", "Ferramentas", "Ferramentas..."],
                            ])}
                        </FieldGroup>

                        <FieldGroup
                            id="s5-pragas"
                            icon="🐛"
                            title="Pragas e Doenças"
                            optional
                            filled={conjuntoPreenchido(["pests", "prevention", "monitoring"], form)}
                            total={3}
                        >
                            {CampoTex("pests", "Pragas e Doenças", "Pragas comuns e tratamento...")}
                            {ColunaSelects([
                                ["prevention", "Prevenção", "Nível de prevenção..."],
                                ["monitoring", "Monitoramento", "Monitoramento..."],
                            ])}
                        </FieldGroup>
                    </div>
                )}

                {/* ── STEP 6: CULTIVO ── */}
                {currentStep === 6 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🌾 Cultivo da Planta</h4>
                            <p>Plantio, exposição e manutenção</p>
                        </div>

                        <FieldGroup
                            id="s6-plantio"
                            icon="🌱"
                            title="Plantio"
                            optional
                            filled={conjuntoPreenchido(["planting", "propagation", "station", "spacing"], form)}
                            total={4}
                        >
                            {CampoTex("planting", "Plantio", "Como plantar...")}
                            {ColunaSelects([
                                ["propagation", "Propagação", "Como se propaga..."],
                                ["station", "Estação", "Estação de plantio..."],
                                ["spacing", "Espaçamento", "Espaçamento entre mudas..."],
                            ])}
                        </FieldGroup>

                        <FieldGroup
                            id="s6-exposicao"
                            icon="☀️"
                            title="Exposição Solar"
                            optional
                            filled={conjuntoPreenchido(["exhibition", "iluminosity", "protection"], form)}
                            total={3}
                        >
                            {CampoTex("exhibition", "Exposição Solar", "Condições de exposição solar...")}
                            {ColunaSelects([
                                ["iluminosity", "Horas de Sol", "Horas diárias..."],
                                ["protection", "Proteção", "Proteção climática..."],
                            ])}
                        </FieldGroup>

                        <FieldGroup
                            id="s6-manutencao"
                            icon="🔧"
                            title="Manutenção"
                            optional
                            filled={conjuntoPreenchido(["maintenance", "idealTemperature", "tolerance"], form)}
                            total={3}
                        >
                            {CampoTex("maintenance", "Manutenção", "Práticas de manutenção...")}
                            {ColunaSelects([
                                ["idealTemperature", "Temperatura Ideal", "Temperatura ideal..."],
                                ["tolerance", "Tolerância", "Tolerância..."],
                            ])}
                        </FieldGroup>
                    </div>
                )}

                {/* ── STEP 6: REVISÃO (apenas com withReview) ── */}
                {withReview && isLastStep && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>✅ Revisão</h4>
                            <p>Confira como a planta aparecerá antes de cadastrar</p>
                        </div>
                        <div className="plant-review">
                            <div className="plant-review__card card mb-3">
                                <div className="plant-review__image-wrap">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="plant-review__image"
                                        />
                                    ) : (
                                        <span className="plant-review__no-image">Sem imagem</span>
                                    )}
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title fw-semibold">{form.name || "—"}</h5>
                                    <p className="fst-italic text-muted mb-2">{form.scientificName || "—"}</p>
                                </div>
                            </div>

                            {/* Pré-visualização dos dados resolvidos */}
                            <div className="plant-review__summary">
                                {form.description && (
                                    <>
                                        <h6 className="fw-bold">Descrição</h6>
                                        <p>{form.description}</p>
                                    </>
                                )}
                                {form.simpleDescription && (
                                    <>
                                        <h6 className="fw-bold">Resumo Rápido</h6>
                                        <p>{form.simpleDescription}</p>
                                    </>
                                )}
                                {REVIEW_GRUPOS.map(g => {
                                    const itens = g.campos
                                        .map(([campo, rotulo]) => {
                                            const ehSelect = Object.prototype.hasOwnProperty.call(mapeamentoColecoes, campo)
                                            const valor = ehSelect
                                                ? (opcoesBanco[campo] || []).find(o => o._id === form[campo])?.name
                                                : form[campo] || ""
                                            return { rotulo, valor }
                                        })
                                        .filter(it => it.valor && String(it.valor).trim())
                                    if (itens.length === 0) return null
                                    return (
                                        <div key={g.label} className="plant-review__grupo mt-3">
                                            <h6 className="fw-bold">{g.label}</h6>
                                            <div className="row">
                                                {itens.map(it => (
                                                    <div className="col-md-4 mb-2" key={it.rotulo}>
                                                        <small className="text-muted d-block">{it.rotulo}</small>
                                                        <span className="fw-semibold">{it.valor}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <p className="text-muted small mt-3">
                            Ao confirmar, a planta será adicionada ao catálogo.
                        </p>
                    </div>
                )}

                {/* ── NAVIGATION ── */}
                <div className="wizard-nav">
                    {canGoBack && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary wizard-nav__btn"
                            onClick={() => setCurrentStep(s => s - 1)}
                        >
                            ← Anterior
                        </button>
                    )}
                    <div className="wizard-nav__spacer" />
                    {canAdvance && (
                        <button
                            type="button"
                            className="btn btn-primary wizard-nav__btn"
                            onClick={() => setCurrentStep(s => s + 1)}
                        >
                            Próximo →
                        </button>
                    )}
                    {isLastStep && (
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg wizard-nav__submit"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <><span className="spinner-border spinner-border-sm me-2" />{submittingLabel}</>
                            ) : submitLabel}
                        </button>
                    )}
                </div>
            </form>

            {/* ── MODAL DE COLEÇÕES ── */}
            <div className="modal fade" id="modalDinamico" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Gerenciar: {modalConfig.labelAmigavel}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Novo valor..."
                                        value={novoValorInput}
                                        onChange={e => setNovoValorInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && salvarNovoItem()}
                                    />
                                    <button className="btn btn-success" type="button" onClick={salvarNovoItem}>Adicionar</button>
                                </div>
                            </div>
                            <div className="mb-2">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="🔍 Buscar valor..."
                                    value={modalSearch}
                                    onChange={e => setModalSearch(e.target.value)}
                                />
                            </div>
                            <div className="text-muted small mb-2">
                                {(opcoesBanco[modalConfig.campoForm] || []).length} valor(es) cadastrado(s)
                            </div>
                            <ul className="wizard-modal-list">
                                {(opcoesBanco[modalConfig.campoForm] || []).length === 0 ? (
                                    <li className="wizard-modal-list__empty">Nenhum valor cadastrado ainda.</li>
                                ) : (
                                    (opcoesBanco[modalConfig.campoForm] || [])
                                        .filter(item => !modalSearch || item.name.toLowerCase().includes(modalSearch.toLowerCase()))
                                        .map(item => (
                                            <li key={item._id} className="wizard-modal-list__item">
                                                <span>{item.name}</span>
                                                <button
                                                    className="wizard-modal-list__delete"
                                                    type="button"
                                                    onClick={() => deletarItem(item._id)}
                                                    title="Remover"
                                                >
                                                    ×
                                                </button>
                                            </li>
                                        ))
                                )}
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}