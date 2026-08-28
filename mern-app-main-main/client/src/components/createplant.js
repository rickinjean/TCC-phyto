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
    0: ["name", "scientificName"],
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
    const [pasteValues, setPasteValues] = useState("")
    const [templates, setTemplates] = useState([])
    const [templateStep, setTemplateStep] = useState(!searchParams.get("clone"))
    const [tmplName, setTmplName] = useState("")
    const [tmplFields, setTmplFields] = useState("")
    const [tmplEditId, setTmplEditId] = useState(null)
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
                const [colRes, tmplRes] = await Promise.all([
                    fetch(`${API_URL}/collections/all`),
                    fetch(`${API_URL}/templates`)
                ])
                if (colRes.ok) {
                    const all = await colRes.json()
                    const mapped = {}
                    for (const [key, meta] of Object.entries(mapeamentoColecoes)) {
                        mapped[key] = all[meta.colecao] || []
                    }
                    setOpcoesBanco(mapped)
                }
                if (tmplRes.ok) {
                    setTemplates(await tmplRes.json())
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

    async function deletarItem(idItem) {
        try {
            const response = await authFetch(`${API_URL}/collections/${modalConfig.colecaoMongo}/${idItem}`, { method: "DELETE" })
            if (response?.ok) {
                setOpcoesBanco(prev => ({
                    ...prev,
                    [modalConfig.campoForm]: (prev[modalConfig.campoForm] || []).filter(item => item._id !== idItem)
                }))
                if (form[modalConfig.campoForm] === idItem) {
                    updateForm({ [modalConfig.campoForm]: "" })
                }
                showToast("Item removido!")
            }
        } catch {
            showToast("Erro ao deletar", "error")
        }
    }

    function applyPastedValues() {
        const lines = pasteValues.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
        const targets = ["Filo", "Classe", "Ordem", "Family", "Genero", "Especie"]
        if (lines.length === 0) return
        const update = {}
        lines.slice(0, targets.length).forEach((val, i) => {
            update[targets[i]] = val
        })
        updateForm(update)
        showToast("Valores distribuídos!")
        const btn = document.querySelector('#modalPaste [data-bs-dismiss="modal"]')
        if (btn) btn.click()
    }

    // Autocomplete da classificação taxonômica a partir do gênero
    async function handleGenusSuggest() {
        const genero = (form.Genero || "").trim()
        if (!genero) return
        try {
            const search = new URLSearchParams({ search: genero })
            const res = await fetch(`${API_URL}/plant/?${search.toString()}`)
            if (!res.ok) return
            const plants = await res.json()
            const match = plants.find(p =>
                p.Genero && p.Genero.trim().toLowerCase() === genero.toLowerCase()
            )
            if (!match) {
                showToast("Nenhuma planta com esse gênero foi encontrada.", "error")
                return
            }
            const update = {}
            if (!form.Filo) update.Filo = match.Filo || ""
            if (!form.Classe) update.Classe = match.Classe || ""
            if (!form.Ordem) update.Ordem = match.Ordem || ""
            if (!form.Family) update.Family = match.Family || ""
            if (!form.Especie) update.Especie = match.Especie || ""
            if (Object.keys(update).length > 0) {
                updateForm(update)
                showToast(`Dados taxonômicos de "${match.name}" preenchidos.`)
            } else {
                showToast("Gênero já tem dados preenchidos.")
            }
        } catch {
            showToast("Erro ao buscar dados do gênero.", "error")
        }
    }

    /* ── TEMPLATES ── */
    function applyTemplate(tmpl) {
        updateForm(tmpl.fields)
        setTemplateStep(false)
        showToast(`Template "${tmpl.name}" aplicado! Ajuste os campos e preencha o restante.`)
    }

    function skipTemplate() {
        setTemplateStep(false)
    }

    async function saveTemplate() {
        if (!tmplName.trim()) {
            showToast("Digite um nome para o template.", "error")
            return
        }
        const fieldsToSave = {}
        ALL_FIELDS.forEach(k => {
            if (form[k] && String(form[k]).trim() !== "") {
                fieldsToSave[k] = form[k]
            }
        })
        if (Object.keys(fieldsToSave).length === 0) {
            showToast("Preencha pelo menos um campo antes de salvar como template.", "error")
            return
        }
        const token = localStorage.getItem("token")
        const headers = { "Content-Type": "application/json" }
        if (token) headers.Authorization = `Bearer ${token}`
        try {
            let res
            if (tmplEditId) {
                res = await fetch(`${API_URL}/templates/${tmplEditId}`, {
                    method: "PUT", headers,
                    body: JSON.stringify({ name: tmplName, fields: fieldsToSave })
                })
            } else {
                res = await fetch(`${API_URL}/templates/add`, {
                    method: "POST", headers,
                    body: JSON.stringify({ name: tmplName, fields: fieldsToSave })
                })
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                showToast(err.message || "Erro ao salvar template.", "error")
                return
            }
            const data = await res.json()
            if (tmplEditId) {
                setTemplates(prev => prev.map(t => t._id === tmplEditId ? { ...t, name: tmplName, fields: fieldsToSave } : t))
                showToast("Template atualizado!")
            } else {
                setTemplates(prev => [...prev, { _id: data._id, name: tmplName, fields: fieldsToSave }])
                showToast("Template salvo!")
            }
            setTmplName("")
            setTmplFields("")
            setTmplEditId(null)
            const btn = document.querySelector('#modalManageTemplates [data-bs-dismiss="modal"]')
            if (btn) btn.click()
        } catch {
            showToast("Erro ao conectar ao servidor.", "error")
        }
    }

    function editTemplate(tmpl) {
        setTmplEditId(tmpl._id)
        setTmplName(tmpl.name)
        setTmplFields(Object.entries(tmpl.fields).map(([k, v]) => `${k}: ${v}`).join("\n"))
    }

    async function deleteTemplate(id) {
        if (!window.confirm("Tem certeza que deseja excluir este template?")) return
        const token = localStorage.getItem("token")
        const headers = {}
        if (token) headers.Authorization = `Bearer ${token}`
        try {
            const res = await fetch(`${API_URL}/templates/${id}`, { method: "DELETE", headers })
            if (res.ok) {
                setTemplates(prev => prev.filter(t => t._id !== id))
                showToast("Template excluído!")
            }
        } catch {
            showToast("Erro ao excluir template.", "error")
        }
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
            {templateStep && (
                <div className="wizard-template-select">
                    <div className="wizard-step-header">
                        <h4>📋 Escolher Template</h4>
                        <p>Selecione um template para pré-preencher os campos ou comece do zero.</p>
                    </div>
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <div className="card h-100 border-0 shadow-sm wizard-template-card" role="button" onClick={skipTemplate}>
                                <div className="card-body text-center">
                                    <div style={{ fontSize: "2rem" }}>📝</div>
                                    <h6 className="card-title mt-2 mb-1">Em branco</h6>
                                    <small className="text-muted">Começar do zero</small>
                                </div>
                            </div>
                        </div>
                        {templates.map(t => (
                            <div className="col-md-4 mb-3" key={t._id}>
                                <div className="card h-100 border-0 shadow-sm wizard-template-card" role="button" onClick={() => applyTemplate(t)}>
                                    <div className="card-body text-center">
                                        <div style={{ fontSize: "2rem" }}>🌿</div>
                                        <h6 className="card-title mt-2 mb-1">{t.name}</h6>
                                        <small className="text-muted">{Object.keys(t.fields).length} campo(s) pré-preenchido(s)</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                        <button type="button" className="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#modalManageTemplates">
                            ⚙️ Gerenciar templates
                        </button>
                    </div>
                </div>
            )}

            {!templateStep && (<>
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
                                <label className="wizard-label">Nome Popular <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className={`form-control ${!form.name ? "is-invalid-mild" : ""}`}
                                    placeholder="Ex: Espada-de-São-Jorge"
                                    value={form.name}
                                    onChange={e => updateForm({ name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Científico <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className={`form-control ${!form.scientificName ? "is-invalid-mild" : ""}`}
                                    placeholder="Ex: Acorus calamus"
                                    value={form.scientificName}
                                    onChange={e => updateForm({ scientificName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <FieldLabel optional>Imagens</FieldLabel>
                                <ImageDropZone imageFiles={imageFiles} setImageFiles={setImageFiles} />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Resumo Rápido</FieldLabel>
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
                                    <FieldLabel optional>Descrição Detalhada</FieldLabel>
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
                                <FieldLabel optional>Fruto</FieldLabel>
                                <SelectField campo="fruit" placeholder="Tipo de fruto..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Origem</FieldLabel>
                                <SelectField campo="origin" placeholder="Origem geográfica..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Função / Tipo</FieldLabel>
                                <SelectField campo="type" placeholder="Função da planta..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Propagação</FieldLabel>
                                <SelectField campo="propagation" placeholder="Como se propaga..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Toxicidade</FieldLabel>
                                <SelectField campo="toxicity" placeholder="Grau de toxicidade..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Dificuldade</FieldLabel>
                                <SelectField campo="dificulty" placeholder="Nível de cuidado..." />
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="wizard-subtitle mb-0">Classificação Taxonômica</h5>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                data-bs-toggle="modal"
                                data-bs-target="#modalPaste"
                            >
                                📋 Colar valores
                            </button>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel optional>Filo</FieldLabel>
                                <input type="text" className="form-control" value={form.Filo} onChange={e => updateForm({ Filo: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel optional>Classe</FieldLabel>
                                <input type="text" className="form-control" value={form.Classe} onChange={e => updateForm({ Classe: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel optional>Ordem</FieldLabel>
                                <input type="text" className="form-control" value={form.Ordem} onChange={e => updateForm({ Ordem: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel optional>Família</FieldLabel>
                                <input type="text" className="form-control" value={form.Family} onChange={e => updateForm({ Family: e.target.value })} />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel optional>Gênero</FieldLabel>
                                <input type="text" className="form-control" value={form.Genero} onChange={e => updateForm({ Genero: e.target.value })} onBlur={handleGenusSuggest} placeholder="Digite e saia do campo" />
                            </div>
                            <div className="col-md-2 col-4 mb-3">
                                <FieldLabel optional>Espécie</FieldLabel>
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
                                <FieldLabel optional>Altura / Porte</FieldLabel>
                                <SelectField campo="height" placeholder="Porte da planta..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel optional>Cor da Flor</FieldLabel>
                                <SelectField campo="flowercolor" placeholder="Cores das flores..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel optional>Folhagem</FieldLabel>
                                <SelectField campo="foliage" placeholder="Tipo de folhagem..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel optional>Época de Floração</FieldLabel>
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
                                <FieldLabel optional>Luminosidade</FieldLabel>
                                <SelectField campo="light" placeholder="Necessidade de luz..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel optional>Água</FieldLabel>
                                <SelectField campo="water" placeholder="Necessidade de água..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel optional>Solo</FieldLabel>
                                <SelectField campo="soil" placeholder="Tipo de solo..." />
                            </div>
                            <div className="col-md-6 mb-3">
                                <FieldLabel optional>Tamanho</FieldLabel>
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
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.watering || ""} max={TEXT_LIMITS.watering} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.watering} placeholder="Como regar esta planta..." value={form.watering} onChange={e => updateForm({ watering: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Melhor Horário</FieldLabel>
                                <SelectField campo="manha" placeholder="Horário ideal..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Quantidade</FieldLabel>
                                <SelectField campo="amount" placeholder="Quantidade..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">🧪 Fertilização</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.fertilizing || ""} max={TEXT_LIMITS.fertilizing} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.fertilizing} placeholder="Como adubar..." value={form.fertilizing} onChange={e => updateForm({ fertilizing: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Frequência</FieldLabel>
                                <SelectField campo="frequency" placeholder="Frequência..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>NPK</FieldLabel>
                                <SelectField campo="NPK" placeholder="Tipo de NPK..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">✂️ Poda</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.pruning || ""} max={TEXT_LIMITS.pruning} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pruning} placeholder="Como podar..." value={form.pruning} onChange={e => updateForm({ pruning: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Época</FieldLabel>
                                <SelectField campo="season" placeholder="Época da poda..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Ferramentas</FieldLabel>
                                <SelectField campo="tools" placeholder="Ferramentas..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">🐛 Pragas e Doenças</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.pests || ""} max={TEXT_LIMITS.pests} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pests} placeholder="Pragas comuns e tratamento..." value={form.pests} onChange={e => updateForm({ pests: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Prevenção</FieldLabel>
                                <SelectField campo="prevention" placeholder="Nível de prevenção..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Monitoramento</FieldLabel>
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
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.planting || ""} max={TEXT_LIMITS.planting} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.planting} placeholder="Como plantar..." value={form.planting} onChange={e => updateForm({ planting: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Estação</FieldLabel>
                                <SelectField campo="station" placeholder="Estação de plantio..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Espaçamento</FieldLabel>
                                <SelectField campo="spacing" placeholder="Espaçamento entre mudas..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">☀️ Exposição Solar</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.exhibition || ""} max={TEXT_LIMITS.exhibition} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.exhibition} placeholder="Condições de exposição solar..." value={form.exhibition} onChange={e => updateForm({ exhibition: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Horas de Sol</FieldLabel>
                                <SelectField campo="iluminosity" placeholder="Horas diárias..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Proteção</FieldLabel>
                                <SelectField campo="protection" placeholder="Proteção climática..." />
                            </div>
                        </div>

                        <h5 className="wizard-subtitle">🔧 Manutenção</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-end">
                                    <CharacterCounter value={form.maintenance || ""} max={TEXT_LIMITS.maintenance} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.maintenance} placeholder="Práticas de manutenção..." value={form.maintenance} onChange={e => updateForm({ maintenance: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Temperatura Ideal</FieldLabel>
                                <SelectField campo="idealTemperature" placeholder="Temperatura..." />
                            </div>
                            <div className="col-md-4 mb-3">
                                <FieldLabel optional>Tolerância</FieldLabel>
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
            </>)}

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

            {/* ── MODAL COLAR VALORES ── */}
            <div className="modal fade" id="modalPaste" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">📋 Colar classificação taxonômica</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted small">
                                Cole os valores na ordem (um por linha ou separados por vírgula):
                                Filo, Classe, Ordem, Família, Gênero, Espécie.
                            </p>
                            <textarea
                                className="form-control"
                                rows="5"
                                placeholder={"Ex:\nTracheophyta\nMagnoliopsida\nAlismatales\nAraceae\nAcorus\ncalamus"}
                                value={pasteValues}
                                onChange={e => setPasteValues(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={applyPastedValues}>Aplicar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL GERENCIAR TEMPLATES ── */}
            <div className="modal fade" id="modalManageTemplates" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">⚙️ Gerenciar Templates</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label fw-semibold">{tmplEditId ? "Editar template" : "Novo template"}</label>
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    placeholder="Nome do template (ex: Frutífera)"
                                    value={tmplName}
                                    onChange={e => setTmplName(e.target.value)}
                                />
                                <textarea
                                    className="form-control"
                                    rows="6"
                                    placeholder={"Campos pré-preenchidos (um por linha, formato campo: valor):\n\nEx:\ntype: Frutífera\nlight: Sol pleno\nwater: Abundante\nsoil: Rico em matéria orgânica\ndificulty: Média\npropagation: Sementes"}
                                    value={tmplFields}
                                    onChange={e => setTmplFields(e.target.value)}
                                />
                                <small className="text-muted">Formato: <code>campo: valor</code> um por linha. Campos válidos: name, scientificName, type, origin, light, water, soil, toxicity, dificulty, height, flowercolor, foliage, flowering, propagation, fruit, manha, amount, frequency, NPK, season, tools, prevention, monitoring, station, spacing, iluminosity, protection, idealTemperature, tolerance, planting, exhibition, maintenance, watering, fertilizing, pruning, pests, simpleDescription, description.</small>
                                <div className="mt-2 d-flex gap-2">
                                    <button type="button" className="btn btn-sm btn-success" onClick={saveTemplate}>
                                        {tmplEditId ? "Atualizar" : "Salvar template"}
                                    </button>
                                    {tmplEditId && (
                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setTmplEditId(null); setTmplName(""); setTmplFields("") }}>
                                            Cancelar edição
                                        </button>
                                    )}
                                </div>
                            </div>
                            <hr />
                            <h6>Templates existentes ({templates.length})</h6>
                            {templates.length === 0 && <p className="text-muted">Nenhum template cadastrado ainda.</p>}
                            <ul className="list-group">
                                {templates.map(t => (
                                    <li key={t._id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{t.name}</strong>
                                            <small className="text-muted ms-2">{Object.keys(t.fields).length} campo(s)</small>
                                        </div>
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => editTemplate(t)}>Editar</button>
                                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteTemplate(t._id)}>Excluir</button>
                                        </div>
                                    </li>
                                ))}
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
