import React, { useState, useEffect, useRef, useMemo } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import mapeamentoColecoes from "../mapeamentoColecoes"
import { decodeId } from "../idCodec"
import MapaDistribuicao from "./MapaDistribuicao"
import { distribuicaoDaPlanta, nomesDe } from "../distribuicao"

import sortPorNome from "../sortOptions"

const BASE_STEPS = [
    { key: "basicos", label: "Dados Básicos", icon: "🌱" },
    { key: "botanica-ambiente", label: "Botânica e Ambiente", icon: "🌿" },
    { key: "taxonomia", label: "Taxonomia", icon: "🧬" },
    { key: "fisicas", label: "Física", icon: "🍂" },
    { key: "cuidados", label: "Cuidados", icon: "🤲" },
    { key: "poda-pragas", label: "Poda e Pragas", icon: "✂️" },
    { key: "cultivo", label: "Cultivo", icon: "🌾" },
    { key: "distribuicao", label: "Distribuição", icon: "🌍" },
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
    distribuicao: { nativa: [], cultivada: [], fonte: "" },
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
        const entries = await Promise.all(Object.entries(mapeamentoColecoes).map(async ([key, meta]) => {
            const res = await fetch(`${API_URL}/collections/${encodeURIComponent(meta.colecao)}?page=1&limit=100`)
            if (!res.ok) return [key, []]
            const page = await res.json()
            return [key, sortPorNome(Array.isArray(page.data) ? page.data : [], key)]
        }))
        setOpcoesBanco(Object.fromEntries(entries))
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
    const [catalogQuery, setCatalogQuery] = useState("")
    const [catalogResults, setCatalogResults] = useState([])
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogSearched, setCatalogSearched] = useState(false)
    const [catalogOpen, setCatalogOpen] = useState(false)
    const [fonteDistribuicao, setFonteDistribuicao] = useState("gbif")
    const [sugestaoDistribuicao, setSugestaoDistribuicao] = useState(null)
    const [sugerindoDistribuicao, setSugerindoDistribuicao] = useState(false)
    const autoSaveTimer = useRef(null)

    const steps = withReview ? [...BASE_STEPS, REVIEW_STEP] : BASE_STEPS

    function showToast(message, type = "success") {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    function updateForm(value) {
        setForm(prev => ({ ...prev, ...value }))
    }

    // Consulta a fonte selecionada. O resultado fica em prévia até ser aplicado.
    async function sugerirDistribuicaoPelaFonte() {
        const nome = String(form.scientificName || "").trim()
        if (!nome) {
            showToast("Preencha o nome científico para consultar a fonte.", "error")
            return
        }

        setSugerindoDistribuicao(true)
        setSugestaoDistribuicao(null)
        try {
            const endpoint = fonteDistribuicao === "flora-brasil"
                ? "/plant/sugerir-distribuicao/flora-brasil"
                : "/plant/sugerir-distribuicao"
            const resposta = await authFetch(
                `${API_URL}${endpoint}?nome=${encodeURIComponent(nome)}`
            )
            if (!resposta) {
                showToast("Sessão expirada. Faça login novamente.", "error")
                return
            }
            const dados = await resposta.json().catch(() => null)
            if (!resposta.ok || !dados || !dados.ok) {
                showToast((dados && dados.message) || "Não foi possível consultar esta fonte agora.", "error")
                return
            }
            setSugestaoDistribuicao(dados)
        } catch {
            showToast("Erro ao conectar à fonte de distribuição. Tente novamente.", "error")
        } finally {
            setSugerindoDistribuicao(false)
        }
    }

    function aplicarSugestaoDistribuicao() {
        if (!sugestaoDistribuicao) return
        const atual = distribuicaoDaPlanta(form)
        updateForm({
            distribuicao: {
                nativa: sugestaoDistribuicao.nativa,
                cultivada: sugestaoDistribuicao.cultivada,
                fonte: sugestaoDistribuicao.fonte || atual.fonte,
            },
        })
        setSugestaoDistribuicao(null)
        showToast("Sugestão aplicada. Revise a distribuição no mapa.")
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
                const formLimpo = { ...data }
                delete formLimpo.latitude
                delete formLimpo.longitude
                formLimpo.distribuicao = distribuicaoDaPlanta(formLimpo)
                setForm(prev => ({ ...prev, ...formLimpo, name: "", scientificName: "" }))
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
                    // Rascunhos antigos podem conter latitude/longitude, que não
                    // fazem mais parte do formulário.
                    const formLimpo = { ...draft.form }
                    delete formLimpo.latitude
                    delete formLimpo.longitude
                    formLimpo.distribuicao = distribuicaoDaPlanta(formLimpo)
                    setForm(formLimpo)
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

    // Busca planta(s) no catálogo pelo nome popular ou científico.
    async function buscarPlantaPorNome(nome) {
        if (!nome) return []
        try {
            const res = await authFetch(`${API_URL}/plant?search=${encodeURIComponent(nome)}&page=1&limit=100`)
            if (!res || !res.ok) return []
            const result = await res.json()
            return Array.isArray(result.data) ? result.data : []
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
        // O objeto de distribuição vai como JSON em um único campo do FormData.
        const anexarCampo = (key) => {
            if (key === "distribuicao") {
                const dist = distribuicaoDaPlanta(form)
                formData.append("distribuicao", JSON.stringify(dist))
                return
            }
            formData.append(key, form[key] ?? "")
        }
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
                    anexarCampo(key)
                }
            })
        } else {
            Object.keys(form).forEach(key => {
                if (key === "imagesPath" || key === "imagePath") return
                anexarCampo(key)
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

    const dist = distribuicaoDaPlanta(form)
    const distPreenchida = dist.nativa.length + dist.cultivada.length + (dist.fonte ? 1 : 0)

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

                {/* ── STEP 7: DISTRIBUIÇÃO GEOGRÁFICA ── */}
                {currentStep === 7 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🌍 Distribuição Geográfica</h4>
                            <p>Onde a espécie é nativa e onde é cultivada ou introduzida</p>
                        </div>
                        <FieldGroup
                            id="distribuicao"
                            icon="🗺️"
                            title="Países de Ocorrência"
                            optional
                            filled={distPreenchida}
                            total={3}
                            hint="Escolha o pincel e clique nos países. Use a busca para ilhas pequenas. A fonte informada aparece na ficha pública."
                        >
                            <div className="phyto-gbif">
                                <div className="phyto-gbif__head">
                                    <label className="phyto-dist-help" htmlFor="fonte-distribuicao">Fonte de distribuição</label>
                                    <select
                                        id="fonte-distribuicao"
                                        className="form-select form-select-sm phyto-dist-source"
                                        value={fonteDistribuicao}
                                        onChange={evento => {
                                            setFonteDistribuicao(evento.target.value)
                                            setSugestaoDistribuicao(null)
                                        }}
                                    >
                                        <option value="gbif">GBIF — distribuição global (WCVP/Kew)</option>
                                        <option value="flora-brasil">Flora e Funga do Brasil (JBRJ)</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        onClick={sugerirDistribuicaoPelaFonte}
                                        disabled={sugerindoDistribuicao}
                                    >
                                        {sugerindoDistribuicao ? "Consultando fonte…" : "🔎 Buscar distribuição"}
                                    </button>
                                    <small className="phyto-dist-help">
                                        A busca usa o nome científico de “Dados Básicos”. O mapa só muda depois de aplicar a prévia.
                                    </small>
                                </div>

                                {sugestaoDistribuicao && (() => {
                                    const totalSugerido = sugestaoDistribuicao.nativa.length + sugestaoDistribuicao.cultivada.length
                                    return (
                                        <div className="phyto-gbif__preview">
                                            <p className="phyto-gbif__titulo">
                                                Sugestão para <strong>{sugestaoDistribuicao.cientifico}</strong>
                                                {Number.isFinite(sugestaoDistribuicao.correspondencia) && (
                                                    <span className="phyto-gbif__confianca">
                                                        {sugestaoDistribuicao.correspondencia}% de correspondência
                                                    </span>
                                                )}
                                            </p>

                                            {totalSugerido === 0 ? (
                                                <p className="phyto-gbif__vazio">
                                                    Esta fonte não retornou países para a espécie. Você ainda pode marcar a distribuição manualmente.
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="phyto-gbif__resumo">
                                                        <strong>{sugestaoDistribuicao.nativa.length}</strong>{" "}
                                                        {sugestaoDistribuicao.nativa.length === 1 ? "país nativo" : "países nativos"}
                                                        {" · "}
                                                        <strong>{sugestaoDistribuicao.cultivada.length}</strong>{" "}
                                                        {sugestaoDistribuicao.cultivada.length === 1
                                                            ? "país cultivado/introduzido"
                                                            : "países cultivados/introduzidos"}
                                                    </p>
                                                    {sugestaoDistribuicao.estados && sugestaoDistribuicao.estados.length > 0 && (
                                                        <p className="phyto-gbif__resumo">
                                                            Estados brasileiros: <strong>{sugestaoDistribuicao.estados.join(", ")}</strong>
                                                            {sugestaoDistribuicao.endemica && " · espécie endêmica no Brasil"}
                                                        </p>
                                                    )}
                                                    {sugestaoDistribuicao.dominios && sugestaoDistribuicao.dominios.length > 0 && (
                                                        <p className="phyto-gbif__resumo">
                                                            Domínios fitogeográficos: <strong>{sugestaoDistribuicao.dominios.join(", ")}</strong>
                                                        </p>
                                                    )}
                                                    {sugestaoDistribuicao.estados && sugestaoDistribuicao.estados.length > 0 && (
                                                        <p className="phyto-gbif__aviso">
                                                            A fonte detalha estados, mas o mapa atual representa países; ao aplicar, o Brasil será marcado como nativo.
                                                        </p>
                                                    )}
                                                </>
                                            )}

                                            <p className="phyto-gbif__fonte">
                                                Fonte: {sugestaoDistribuicao.fonte} · {sugestaoDistribuicao.totalRegistros}{" "}
                                                {sugestaoDistribuicao.totalRegistros === 1 ? "registro" : "registros"}
                                                {sugestaoDistribuicao.ignoradas > 0 &&
                                                    ` · ${sugestaoDistribuicao.ignoradas} sem país correspondente`}
                                            </p>

                                            <div className="phyto-gbif__acoes">
                                                {totalSugerido > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-success"
                                                        onClick={aplicarSugestaoDistribuicao}
                                                    >
                                                        Aplicar sugestão
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setSugestaoDistribuicao(null)}
                                                >
                                                    Descartar
                                                </button>
                                            </div>

                                            {totalSugerido > 0 && (
                                                <p className="phyto-gbif__aviso">
                                                    Aplicar substitui os países marcados agora. Você pode ajustar
                                                    no mapa depois.
                                                </p>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>

                            <MapaDistribuicao
                                editavel
                                nativa={dist.nativa}
                                cultivada={dist.cultivada}
                                onChange={({ nativa, cultivada }) => updateForm({
                                    distribuicao: { ...dist, nativa, cultivada },
                                })}
                            />

                            <div className="row mt-3">
                                <div className="col-lg-8">
                                    <FieldLabel optional>Fonte da informação</FieldLabel>
                                    <input
                                        type="text"
                                        className="form-control"
                                        maxLength={160}
                                        placeholder="Ex.: POWO – Plants of the World Online (Kew), out/2026"
                                        value={dist.fonte}
                                        onChange={evento => updateForm({
                                            distribuicao: { ...dist, fonte: evento.target.value },
                                        })}
                                    />
                                    <small className="phyto-dist-help">
                                        Consulte o POWO (powo.science.kew.org) para confirmar a distribuição nativa.
                                    </small>
                                </div>
                            </div>
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
                                {(dist.nativa.length > 0 || dist.cultivada.length > 0 || dist.fonte) && (
                                    <div className="plant-review__grupo mt-3">
                                        <h6 className="fw-bold">🌍 Distribuição Geográfica</h6>
                                        <div className="row">
                                            <div className="col-md-6 mb-2">
                                                <small className="text-muted d-block">Nativa ({dist.nativa.length})</small>
                                                <span className="fw-semibold">{nomesDe(dist.nativa).join(", ") || "—"}</span>
                                            </div>
                                            <div className="col-md-6 mb-2">
                                                <small className="text-muted d-block">
                                                    Cultivada / introduzida ({dist.cultivada.length})
                                                </small>
                                                <span className="fw-semibold">{nomesDe(dist.cultivada).join(", ") || "—"}</span>
                                            </div>
                                            {dist.fonte && (
                                                <div className="col-12 mb-2">
                                                    <small className="text-muted d-block">Fonte</small>
                                                    <span className="fw-semibold">{dist.fonte}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
