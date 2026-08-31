import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import mapeamentoColecoes from "../mapeamentoColecoes"
import { decodeId } from "../idCodec"
import SearchableSelect from "./SearchableSelect"

const STEPS = [
    { key: "basicos", label: "Dados Básicos", icon: "🌱" },
    { key: "botanica", label: "Botânica", icon: "🌿" },
    { key: "fisicas", label: "Física", icon: "🍂" },
    { key: "ambiente", label: "Ambiente", icon: "☀️" },
    { key: "cuidados", label: "Cuidados", icon: "🤲" },
    { key: "cultivo", label: "Cultivo", icon: "🌾" },
    { key: "revisao", label: "Revisão", icon: "✅" },
]

// Campos obrigatórios por step (índice do step -> lista de campos de formulário)
const REQUIRED_BY_STEP = {
    0: [],
}

// Todos os campos do formulário (para cálculo de progresso)
const ALL_FIELDS = Object.keys({
    name: "", scientificName: "", description: "", simpleDescription: "",
    fruit: "", origin: "", type: "", propagation: "", toxicity: "", dificulty: "",
    Filo: "", Classe: "", Ordem: "", Family: "", Genero: "", Especie: "",
    height: "", flowercolor: "", foliage: "", flowering: "",
    light: "", water: "", size: "", soil: "",
    watering: "", fertilizing: "", pruning: "", pests: "",
    manha: "", amount: "", frequency: "", NPK: "", season: "", tools: "", prevention: "", monitoring: "",
    planting: "", exhibition: "", maintenance: "",
    station: "", spacing: "", iluminosity: "", protection: "", idealTemperature: "", tolerance: "",
})

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
}

const AUTOSAVE_KEY = "phyto-plant-draft"
const AUTOSAVE_DELAY = 3000

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

function ImageDropZone({ imageFiles, setImageFiles }) {
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

    function handleDrop(e) {
        e.preventDefault()
        setDragging(false)
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
        addFiles(files)
    }

    function addFiles(newFiles) {
        setImageFiles(prev => {
            const merged = [...prev]
            for (const file of newFiles) {
                if (merged.length >= 5) break
                if (!merged.some(f => f.name === file.name && f.size === file.size)) {
                    merged.push(file)
                }
            }
            return merged
        })
    }

    function removeFile(index) {
        setImageFiles(prev => prev.filter((_, i) => i !== index))
    }

    function handleInput(e) {
        addFiles(Array.from(e.target.files))
        e.target.value = null
    }

    return (
        <div className="wizard-dropzone-wrapper">
            <div
                className={`wizard-dropzone ${dragging ? "wizard-dropzone--active" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
            >
                <span className="wizard-dropzone__icon">📷</span>
                <span className="wizard-dropzone__text">
                    Arraste imagens aqui ou <strong>clique para selecionar</strong>
                </span>
                <span className="wizard-dropzone__hint">Até 5 imagens (JPG, PNG)</span>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleInput}
                    className="d-none"
                />
            </div>
            {imageFiles.length > 0 && (
                <div className="wizard-dropzone__previews">
                    {imageFiles.map((file, i) => (
                        <div key={i} className="wizard-dropzone__thumb">
                            <img src={objectUrls.current[i]} alt={file.name} />
                            <button
                                type="button"
                                className="wizard-dropzone__remove"
                                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                                aria-label="Remover imagem"
                            >
                                ×
                            </button>
                            <span className="wizard-dropzone__order">{i + 1}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Helper para label com marcador de opcional
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

export default function Create() {
    const [form, setForm] = useState(INITIAL_FORM)
    const [imageFiles, setImageFiles] = useState([])
    const [currentStep, setCurrentStep] = useState(0)
    const [opcoesBanco, setOpcoesBanco] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [modalConfig, setModalConfig] = useState({ campoForm: "", colecaoMongo: "", labelAmigavel: "" })
    const [novoValorInput, setNovoValorInput] = useState("")
    const [modalSearch, setModalSearch] = useState("")
    const [toast, setToast] = useState(null)
    const [hasDraft, setHasDraft] = useState(false)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const autoSaveTimer = useRef(null)

    // Clonar planta: busca dados e pré-preenche o formulário
    useEffect(() => {
        const cloneId = searchParams.get("clone")
        if (!cloneId) return
        const realId = decodeId(cloneId)
        async function loadClone() {
            try {
                const token = localStorage.getItem("token")
                const headers = {}
                if (token) headers.Authorization = `Bearer ${token}`
                const res = await fetch(`${API_URL}/plant/${realId}/clone`, { headers })
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
    }, [searchParams])

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const res = await fetch(`${API_URL}/collections/all`)
                if (res.ok) {
                    const all = await res.json()
                    const mapped = {}
                    for (const [key, meta] of Object.entries(mapeamentoColecoes)) {
                        mapped[key] = all[meta.colecao] || []
                    }
                    setOpcoesBanco(mapped)
                }
            } catch (err) {
                console.error("Erro ao carregar coleções:", err)
            }
            setLoading(false)
        }
        load()
    }, [])

    // Restore draft on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(AUTOSAVE_KEY)
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
        if (loading) return
        clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = setTimeout(() => {
            const draft = { form, imageNames: imageFiles.map(f => f.name), currentStep }
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft))
        }, AUTOSAVE_DELAY)
        return () => clearTimeout(autoSaveTimer.current)
    }, [form, imageFiles, currentStep, loading])

    function clearDraft() {
        localStorage.removeItem(AUTOSAVE_KEY)
        setForm(INITIAL_FORM)
        setImageFiles([])
        setCurrentStep(0)
        setHasDraft(false)
        showToast("Rascunho limpo!")
    }

    function showToast(message, type = "success") {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    function updateForm(value) {
        setForm(prev => ({ ...prev, ...value }))
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
                [modalConfig.campoForm]: [...(prev[modalConfig.campoForm] || []), item]
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

    const onSubmit = useCallback(async (e) => {
        e.preventDefault()
        setSubmitting(true)
        const formData = new FormData()
        Object.keys(form).forEach(key => formData.append(key, form[key]))
        imageFiles.forEach(file => formData.append("images", file))

        try {
            const token = localStorage.getItem("token")
            const headers = {}
            if (token) headers.Authorization = `Bearer ${token}`

            const response = await fetch(`${API_URL}/plant/add`, {
                method: "POST",
                headers,
                body: formData
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                showToast(err.message || "Erro ao cadastrar", "error")
                return
            }

            localStorage.removeItem(AUTOSAVE_KEY)
            showToast("Planta cadastrada com sucesso!")
            setTimeout(() => navigate("/plantlist"), 1200)
        } catch {
            showToast("Erro ao conectar ao servidor", "error")
        } finally {
            setSubmitting(false)
        }
    }, [form, imageFiles, navigate])

    // Validação dos campos obrigatórios do step atual
    const requiredForStep = REQUIRED_BY_STEP[currentStep] || []
    const stepErrors = requiredForStep.filter(field => !form[field])

    const isReviewStep = currentStep === STEPS.length - 1
    const canGoBack = currentStep > 0
    const canAdvance = currentStep < STEPS.length - 1 && stepErrors.length === 0

    // Disponível apenas quando não é o último step e não é o step de revisão
    // O botão "Próximo" é o avanço; o submit fica no step de revisão

    // Percentual de campos preenchidos
    const progress = useMemo(() => {
        const filled = ALL_FIELDS.filter(k => form[k]).length
        return Math.round((filled / ALL_FIELDS.length) * 100)
    }, [form])

    // Progresso por step obrigatório
    const requiredProgress = useMemo(() => {
        const totalRequired = Object.values(REQUIRED_BY_STEP).reduce((a, l) => a + l.length, 0)
        const doneRequired = Object.values(REQUIRED_BY_STEP).reduce((acc, list) =>
            acc + list.filter(f => form[f]).length, 0)
        return totalRequired > 0 ? Math.round((doneRequired / totalRequired) * 100) : 100
    }, [form])

    // URL estável para o preview da primeira imagem (evita vazamento de memória)
    const previewUrl = useMemo(() => {
        if (imageFiles.length === 0) return null
        return URL.createObjectURL(imageFiles[0])
    }, [imageFiles])
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
    }, [previewUrl])

    function goToStep(next) {
        if (next > currentStep && stepErrors.length > 0) {
            showToast("Preencha os campos obrigatórios com * para continuar.", "error")
            return
        }
        setCurrentStep(next)
    }

    function SelectField({ campo, placeholder }) {
        return (
            <SearchableSelect
                campo={campo}
                placeholder={placeholder}
                value={form[campo]}
                options={opcoesBanco[campo] || []}
                onChange={id => updateForm({ [campo]: id })}
                onManage={() => abrirModalPara(campo)}
                onDelete={id => deletarItemDoCampo(campo, id)}
            />
        )
    }

    if (loading) {
        return (
            <div className="admin-page admin-page--plant-form container mt-4">
                <div className="wizard-loading">
                    <div className="spinner-border" role="status" />
                    <p>Carregando opções...</p>
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
                <h3 className="admin-page__title">Cadastrar Nova Planta</h3>
                {hasDraft && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearDraft}>
                        Limpar rascunho
                    </button>
                )}
            </div>

            {/* ── SELEÇÃO DE TEMPLATE ── */}
            <div className="wizard-progress mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="wizard-progress__label">
                        {requiredProgress < 100 ? `Campos obrigatórios: ${requiredProgress}%` : "Campos obrigatórios completos ✓"} — Preenchimento geral: {progress}%
                    </span>
                    <span className="wizard-progress__pct">{progress}%</span>
                </div>
                <div className="wizard-progress__bar">
                    <div className="wizard-progress__fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* ── STEPPER ── */}
            <div className="wizard-stepper">
                {STEPS.map((step, i) => (
                    <button
                        key={step.key}
                        type="button"
                        className={`wizard-stepper__step ${i === currentStep ? "wizard-stepper__step--active" : ""} ${i < currentStep ? "wizard-stepper__step--done" : ""}`}
                        onClick={() => goToStep(i)}
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
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>
            </div>

            <form className="plant-admin-form wizard-form" onSubmit={onSubmit}>
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
                                <FieldLabel>Imagens</FieldLabel>
                                <ImageDropZone imageFiles={imageFiles} setImageFiles={setImageFiles} />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Resumo Rápido</FieldLabel>
                                    <CharacterCounter value={form.simpleDescription || ""} max={TEXT_LIMITS.simpleDescription} />
                                </div>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    maxLength={TEXT_LIMITS.simpleDescription}
                                    placeholder="Uma frase curta sobre a planta..."
                                    value={form.simpleDescription}
                                    onChange={e => updateForm({ simpleDescription: e.target.value })}
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Descrição Detalhada</FieldLabel>
                                    <CharacterCounter value={form.description || ""} max={TEXT_LIMITS.description} />
                                </div>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    maxLength={TEXT_LIMITS.description}
                                    placeholder="Descrição completa da planta, suas características, usos..."
                                    value={form.description}
                                    onChange={e => updateForm({ description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: BOTÂNICA ── */}
                {currentStep === 1 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🌿 Informações Botânicas</h4>
                            <p>Classificação, origem e características gerais</p>
                        </div>
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Fruto</FieldLabel>
                                <SelectField campo="fruit" placeholder="Tipo de fruto..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Origem</FieldLabel>
                                <SelectField campo="origin" placeholder="Origem geográfica..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Tipo</FieldLabel>
                                <SelectField campo="type" placeholder="Tipo de planta..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Propagação</FieldLabel>
                                <SelectField campo="propagation" placeholder="Como se propaga..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Toxicidade</FieldLabel>
                                <SelectField campo="toxicity" placeholder="Grau de toxicidade..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Dificuldade</FieldLabel>
                                <SelectField campo="dificulty" placeholder="Nível de cuidado..." />
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="wizard-subtitle mb-0">Classificação Taxonômica</h5>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel>Filo</FieldLabel>
                                <input type="text" className="form-control" value={form.Filo} onChange={e => updateForm({ Filo: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel>Classe</FieldLabel>
                                <input type="text" className="form-control" value={form.Classe} onChange={e => updateForm({ Classe: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel>Ordem</FieldLabel>
                                <input type="text" className="form-control" value={form.Ordem} onChange={e => updateForm({ Ordem: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel>Família</FieldLabel>
                                <input type="text" className="form-control" value={form.Family} onChange={e => updateForm({ Family: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel>Gênero</FieldLabel>
                                <input type="text" className="form-control" value={form.Genero} onChange={e => updateForm({ Genero: e.target.value })} placeholder="Digite e saia do campo" />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel>Espécie</FieldLabel>
                                <input type="text" className="form-control" value={form.Especie} onChange={e => updateForm({ Especie: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: CARACTERÍSTICAS FÍSICAS ── */}
                {currentStep === 2 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🍂 Características Físicas</h4>
                            <p>Aparência visual da planta</p>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Altura / Porte</FieldLabel>
                                <SelectField campo="height" placeholder="Porte da planta..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Cor da Flor</FieldLabel>
                                <SelectField campo="flowercolor" placeholder="Cores das flores..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Folhagem</FieldLabel>
                                <SelectField campo="foliage" placeholder="Tipo de folhagem..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Época de Floração</FieldLabel>
                                <SelectField campo="flowering" placeholder="Quando floresce..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: NECESSIDADES AMBIENTAIS ── */}
                {currentStep === 3 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>☀️ Necessidades Ambientais</h4>
                            <p>Condições ideais de cultivo</p>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Luminosidade</FieldLabel>
                                <SelectField campo="light" placeholder="Necessidade de luz..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Água</FieldLabel>
                                <SelectField campo="water" placeholder="Necessidade de água..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Solo</FieldLabel>
                                <SelectField campo="soil" placeholder="Tipo de solo..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel>Tamanho</FieldLabel>
                                <SelectField campo="size" placeholder="Tamanho recomendado..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 4: CUIDADOS ── */}
                {currentStep === 4 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🤲 Cuidados da Planta</h4>
                            <p>Rega, adubação, poda e pragas</p>
                        </div>

                        <h5 className="wizard-subtitle">💧 Rega</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Rega</FieldLabel>
                                    <CharacterCounter value={form.watering || ""} max={TEXT_LIMITS.watering} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.watering} placeholder="Como regar esta planta..." value={form.watering} onChange={e => updateForm({ watering: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Melhor Horário</FieldLabel>
                                <SelectField campo="manha" placeholder="Horário ideal..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Quantidade</FieldLabel>
                                <SelectField campo="amount" placeholder="Quantidade..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">🧪 Adubação</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Adubação</FieldLabel>
                                    <CharacterCounter value={form.fertilizing || ""} max={TEXT_LIMITS.fertilizing} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.fertilizing} placeholder="Como adubar esta planta..." value={form.fertilizing} onChange={e => updateForm({ fertilizing: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Frequência de Adubação</FieldLabel>
                                <SelectField campo="frequency" placeholder="Frequência..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Tipo de NPK</FieldLabel>
                                <SelectField campo="NPK" placeholder="Tipo de NPK..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">✂️ Poda</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Poda</FieldLabel>
                                    <CharacterCounter value={form.pruning || ""} max={TEXT_LIMITS.pruning} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pruning} placeholder="Como podar..." value={form.pruning} onChange={e => updateForm({ pruning: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Época</FieldLabel>
                                <SelectField campo="season" placeholder="Época da poda..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Ferramentas</FieldLabel>
                                <SelectField campo="tools" placeholder="Ferramentas..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">🐛 Pragas e Doenças</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Pragas e Doenças</FieldLabel>
                                    <CharacterCounter value={form.pests || ""} max={TEXT_LIMITS.pests} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pests} placeholder="Pragas comuns e tratamento..." value={form.pests} onChange={e => updateForm({ pests: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Prevenção</FieldLabel>
                                <SelectField campo="prevention" placeholder="Nível de prevenção..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Monitoramento</FieldLabel>
                                <SelectField campo="monitoring" placeholder="Monitoramento..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 5: CULTIVO ── */}
                {currentStep === 5 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header">
                            <h4>🌾 Cultivo da Planta</h4>
                            <p>Plantio, exposição e manutenção</p>
                        </div>

                        <h5 className="wizard-subtitle">🌱 Plantio</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Plantio</FieldLabel>
                                    <CharacterCounter value={form.planting || ""} max={TEXT_LIMITS.planting} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.planting} placeholder="Como plantar..." value={form.planting} onChange={e => updateForm({ planting: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Estação</FieldLabel>
                                <SelectField campo="station" placeholder="Estação de plantio..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Espaçamento</FieldLabel>
                                <SelectField campo="spacing" placeholder="Espaçamento entre mudas..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">☀️ Exposição Solar</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Exposição Solar</FieldLabel>
                                    <CharacterCounter value={form.exhibition || ""} max={TEXT_LIMITS.exhibition} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.exhibition} placeholder="Condições de exposição solar..." value={form.exhibition} onChange={e => updateForm({ exhibition: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Horas de Sol</FieldLabel>
                                <SelectField campo="iluminosity" placeholder="Horas diárias..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Proteção</FieldLabel>
                                <SelectField campo="protection" placeholder="Proteção climática..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">🔧 Manutenção</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel>Manutenção</FieldLabel>
                                    <CharacterCounter value={form.maintenance || ""} max={TEXT_LIMITS.maintenance} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.maintenance} placeholder="Práticas de manutenção..." value={form.maintenance} onChange={e => updateForm({ maintenance: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Temperatura Ideal</FieldLabel>
                                <SelectField campo="idealTemperature" placeholder="Temperatura..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel>Tolerância</FieldLabel>
                                <SelectField campo="tolerance" placeholder="Tolerância..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 6: REVISÃO ── */}
                {isReviewStep && (
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
                                <div className="row mt-3">
                                    {[
                                        ["type", "Tipo"],
                                        ["origin", "Origem"],
                                        ["toxicity", "Toxicidade"],
                                        ["dificulty", "Dificuldade"],
                                        ["height", "Porte"],
                                        ["flowercolor", "Cor da Flor"],
                                        ["light", "Luz"],
                                        ["water", "Água"],
                                        ["soil", "Solo"],
                                    ].map(([field, label]) => {
                                        const name = (opcoesBanco[field] || []).find(o => o._id === form[field])?.name
                                        if (!name) return null
                                        return (
                                            <div className="col-md-4 mb-2" key={field}>
                                                <small className="text-muted d-block">{label}</small>
                                                <span className="fw-semibold">{name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
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
                            onClick={() => goToStep(currentStep + 1)}
                        >
                            Próximo →
                        </button>
                    )}
                    {isReviewStep && (
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg wizard-nav__submit"
                            disabled={submitting || stepErrors.length > 0}
                        >
                            {submitting ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Cadastrando...</>
                            ) : "Cadastrar Planta"}
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
