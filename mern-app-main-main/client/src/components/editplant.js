import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import mapeamentoColecoes from "../mapeamentoColecoes"
import { decodeId } from "../idCodec"
import PlantSuggestBar from "./PlantSuggestBar"

const STEPS = [
    { key: "basicos", label: "Dados Básicos", icon: "🌱" },
    { key: "botanica", label: "Botânica", icon: "🌿" },
    { key: "fisicas", label: "Física", icon: "🍂" },
    { key: "ambiente", label: "Ambiente", icon: "☀️" },
    { key: "cuidados", label: "Cuidados", icon: "🤲" },
    { key: "cultivo", label: "Cultivo", icon: "🌾" },
]

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

function ImageDropZone({ imageFiles, setImageFiles, existingImages, setExistingImages }) {
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
                if (merged.length + existingImages.length >= 5) break
                if (!merged.some(f => f.name === file.name && f.size === file.size)) {
                    merged.push(file)
                }
            }
            return merged
        })
    }

    function removeExisting(index) {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    function removeNew(index) {
        setImageFiles(prev => prev.filter((_, i) => i !== index))
    }

    function handleInput(e) {
        addFiles(Array.from(e.target.files))
        e.target.value = null
    }

    const totalImages = existingImages.length + imageFiles.length

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
                                onClick={() => removeExisting(i)}
                                aria-label="Remover imagem existente"
                            >
                                ×
                            </button>
                            <span className="wizard-dropzone__order">{i + 1}</span>
                        </div>
                    ))}
                </div>
            )}
            {totalImages < 5 && (
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
                    <span className="wizard-dropzone__hint">{5 - totalImages} vaga(s) restante(s)</span>
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
                        <div key={`new-${i}`} className="wizard-dropzone__thumb wizard-dropzone__thumb--new">
                            <img src={objectUrls.current[i]} alt={file.name} />
                            <button
                                type="button"
                                className="wizard-dropzone__remove"
                                onClick={() => removeNew(i)}
                                aria-label="Remover imagem"
                            >
                                ×
                            </button>
                            <span className="wizard-dropzone__order">Nova {existingImages.length + i + 1}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function Edit() {
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
    const params = useParams()
    const navigate = useNavigate()
    const realId = decodeId(params.id)

    useEffect(() => {
        async function loadAll() {
            setLoading(true)
            const id = realId

            const [plantRes, collectionsRes] = await Promise.all([
                fetch(`${API_URL}/plant/${id}`),
                fetch(`${API_URL}/collections/all`)
            ])

            if (!plantRes.ok) {
                setToast({ message: "Planta não encontrada", type: "error" })
                setTimeout(() => navigate("/plantlist"), 2000)
                return
            }

            const plant = await plantRes.json()
            setForm(plant)
            setExistingImages(plant.imagesPath || (plant.imagePath ? [plant.imagePath] : []))

            if (collectionsRes.ok) {
                const all = await collectionsRes.json()
                const mapped = {}
                for (const [key, meta] of Object.entries(mapeamentoColecoes)) {
                    mapped[key] = all[meta.colecao] || []
                }
                setOpcoesBanco(mapped)
            }
            setLoading(false)
        }
        loadAll()
    }, [realId, navigate])

    function updateForm(value) {
        setForm(prev => ({ ...prev, ...value }))
    }

    function showToast(message, type = "success") {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
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

    // Preenchimento automático da classificação taxonômica via GBIF (API gratuita)
    async function handleTaxonomySuggest() {
        const query = [form.Especie, form.Genero].map(s => (s || "").trim()).filter(Boolean).join(" ")
        if (!query) {
            showToast("Preencha o Gênero ou a Espécie para buscar.", "error")
            return
        }
        try {
            const res = await fetch(`${API_URL}/plant/taxonomy-suggest?${new URLSearchParams({ q: query })}`)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                showToast(err.message || "Não foi possível identificar a classificação.", "error")
                return
            }
            const data = await res.json()
            updateForm({
                Filo: data.Filo || "",
                Classe: data.Classe || "",
                Ordem: data.Ordem || "",
                Family: data.Family || "",
                Genero: data.Genero || "",
                Especie: data.Especie || ""
            })
            showToast("Classificação taxonômica preenchida automaticamente.")
        } catch {
            showToast("Erro ao consultar a base taxonômica.", "error")
        }
    }

    // Aplica o auto-preenchimento completo de uma planta sugerida
    function applySuggestion(fields) {
        if (fields.name) updateForm({ name: fields.name })
        if (fields.scientificName) updateForm({ scientificName: fields.scientificName })
        updateForm(fields)
        const count = Object.keys(fields).length
        showToast(`Auto-preenchimento aplicado (${count} campos). Revise os dados antes de salvar.`)
    }

    async function onSubmit(e) {
        e.preventDefault()
        setSubmitting(true)

        const formData = new FormData()
        Object.keys(form).forEach(key => {
            if (key === "imagesPath") {
                existingImages.forEach(path => formData.append("imagesPath", path))
            } else {
                formData.append(key, form[key])
            }
        })
        imageFiles.forEach(file => formData.append("images", file))

        try {
            const token = localStorage.getItem("token")
            const headers = {}
            if (token) headers.Authorization = `Bearer ${token}`

            const response = await fetch(`${API_URL}/plant/${realId}`, {
                method: "PUT",
                headers,
                body: formData
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                showToast(err.message || "Erro ao atualizar", "error")
                return
            }

            showToast("Planta atualizada com sucesso!")
            setTimeout(() => navigate("/plantlist"), 1200)
        } catch {
            showToast("Erro ao conectar ao servidor", "error")
        } finally {
            setSubmitting(false)
        }
    }

    function SelectField({ campo, placeholder }) {
        const filtered = modalSearch && modalConfig.campoForm === campo
            ? (opcoesBanco[campo] || []).filter(i => i.name.toLowerCase().includes(modalSearch.toLowerCase()))
            : (opcoesBanco[campo] || [])

        return (
            <div className="wizard-select-group">
                <select
                    className="form-control"
                    value={form[campo]}
                    onChange={e => updateForm({ [campo]: e.target.value })}
                >
                    <option value="">{placeholder}</option>
                    {filtered.map(item => (
                        <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    className="wizard-select-plus"
                    data-bs-toggle="modal"
                    data-bs-target="#modalDinamico"
                    onClick={() => abrirModalPara(campo)}
                    title="Gerenciar valores"
                >
                    +
                </button>
            </div>
        )
    }

    const canAdvance = currentStep < STEPS.length - 1
    const canGoBack = currentStep > 0
    const isLastStep = currentStep === STEPS.length - 1

    if (loading) {
        return (
            <div className="admin-page admin-page--plant-form container mt-4">
                <div className="wizard-loading">
                    <div className="spinner-border" role="status" />
                    <p>Carregando dados da planta...</p>
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
                <h3 className="admin-page__title">Editar: {form.name}</h3>
            </div>

            {/* ── STEPPER ── */}
            <div className="wizard-stepper">
                {STEPS.map((step, i) => (
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
                        <div className="wizard-step-content__suggest mb-3">
                            <PlantSuggestBar onApply={applySuggestion} />
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Popular <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={form.name} onChange={e => updateForm({ name: e.target.value })} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Científico <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" value={form.scientificName} onChange={e => updateForm({ scientificName: e.target.value })} required />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="wizard-label">Imagens</label>
                                <ImageDropZone
                                    imageFiles={imageFiles}
                                    setImageFiles={setImageFiles}
                                    existingImages={existingImages}
                                    setExistingImages={setExistingImages}
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="wizard-label">Resumo Rápido</label>
                                <textarea className="form-control" rows="2" value={form.simpleDescription} onChange={e => updateForm({ simpleDescription: e.target.value })} />
                            </div>
                            <div className="col-12 mb-3">
                                <label className="wizard-label">Descrição Detalhada</label>
                                <textarea className="form-control" rows="4" value={form.description} onChange={e => updateForm({ description: e.target.value })} />
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
                            <div className="col-md-4 mb-3"><label className="wizard-label">Fruto</label><SelectField campo="fruit" placeholder="Tipo de fruto..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Origem</label><SelectField campo="origin" placeholder="Origem geográfica..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Função / Tipo</label><SelectField campo="type" placeholder="Função da planta..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Propagação</label><SelectField campo="propagation" placeholder="Como se propaga..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Toxicidade</label><SelectField campo="toxicity" placeholder="Grau de toxicidade..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Dificuldade</label><SelectField campo="dificulty" placeholder="Nível de cuidado..." /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h5 className="wizard-subtitle mb-0">Classificação Taxonômica</h5>
                            <button type="button" className="btn btn-sm btn-success" onClick={handleTaxonomySuggest}>
                                🔍 Preencher classificação
                            </button>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-2 col-4 mb-3"><label className="wizard-label">Filo</label><input type="text" className="form-control" value={form.Filo} onChange={e => updateForm({ Filo: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><label className="wizard-label">Classe</label><input type="text" className="form-control" value={form.Classe} onChange={e => updateForm({ Classe: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><label className="wizard-label">Ordem</label><input type="text" className="form-control" value={form.Ordem} onChange={e => updateForm({ Ordem: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><label className="wizard-label">Família</label><input type="text" className="form-control" value={form.Family} onChange={e => updateForm({ Family: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><label className="wizard-label">Gênero</label><input type="text" className="form-control" value={form.Genero} onChange={e => updateForm({ Genero: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><label className="wizard-label">Espécie</label><input type="text" className="form-control" value={form.Especie} onChange={e => updateForm({ Especie: e.target.value })} /></div>
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
                            <div className="col-md-6 mb-3"><label className="wizard-label">Altura / Porte</label><SelectField campo="height" placeholder="Porte da planta..." /></div>
                            <div className="col-md-6 mb-3"><label className="wizard-label">Cor da Flor</label><SelectField campo="flowercolor" placeholder="Cores das flores..." /></div>
                            <div className="col-md-6 mb-3"><label className="wizard-label">Folhagem</label><SelectField campo="foliage" placeholder="Tipo de folhagem..." /></div>
                            <div className="col-md-6 mb-3"><label className="wizard-label">Época de Floração</label><SelectField campo="flowering" placeholder="Quando floresce..." /></div>
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
                            <div className="col-md-6 mb-3"><label className="wizard-label">Luminosidade</label><SelectField campo="light" placeholder="Necessidade de luz..." /></div>
                            <div className="col-md-6 mb-3"><label className="wizard-label">Água</label><SelectField campo="water" placeholder="Necessidade de água..." /></div>
                            <div className="col-md-6 mb-3"><label className="wizard-label">Solo</label><SelectField campo="soil" placeholder="Tipo de solo..." /></div>
                            <div className="col-md-6 mb-3"><label className="wizard-label">Tamanho</label><SelectField campo="size" placeholder="Tamanho recomendado..." /></div>
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
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.watering} onChange={e => updateForm({ watering: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Melhor Horário</label><SelectField campo="manha" placeholder="Horário ideal..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Quantidade</label><SelectField campo="amount" placeholder="Quantidade..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🧪 Fertilização</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.fertilizing} onChange={e => updateForm({ fertilizing: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Frequência</label><SelectField campo="frequency" placeholder="Frequência..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">NPK</label><SelectField campo="NPK" placeholder="Tipo de NPK..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">✂️ Poda</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.pruning} onChange={e => updateForm({ pruning: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Época</label><SelectField campo="season" placeholder="Época da poda..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Ferramentas</label><SelectField campo="tools" placeholder="Ferramentas..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🐛 Pragas e Doenças</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.pests} onChange={e => updateForm({ pests: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Prevenção</label><SelectField campo="prevention" placeholder="Nível de prevenção..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Monitoramento</label><SelectField campo="monitoring" placeholder="Monitoramento..." /></div>
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
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.planting} onChange={e => updateForm({ planting: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Estação</label><SelectField campo="station" placeholder="Estação de plantio..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Espaçamento</label><SelectField campo="spacing" placeholder="Espaçamento entre mudas..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">☀️ Exposição Solar</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.exhibition} onChange={e => updateForm({ exhibition: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Horas de Sol</label><SelectField campo="iluminosity" placeholder="Horas diárias..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Proteção</label><SelectField campo="protection" placeholder="Proteção climática..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🔧 Manutenção</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><textarea className="form-control" rows="2" value={form.maintenance} onChange={e => updateForm({ maintenance: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Temperatura Ideal</label><SelectField campo="idealTemperature" placeholder="Temperatura..." /></div>
                            <div className="col-md-4 mb-3"><label className="wizard-label">Tolerância</label><SelectField campo="tolerance" placeholder="Tolerância..." /></div>
                        </div>
                    </div>
                )}

                {/* ── NAVIGATION ── */}
                <div className="wizard-nav">
                    {canGoBack && (
                        <button type="button" className="btn btn-outline-secondary wizard-nav__btn" onClick={() => setCurrentStep(s => s - 1)}>
                            ← Anterior
                        </button>
                    )}
                    <div className="wizard-nav__spacer" />
                    {canAdvance && (
                        <button type="button" className="btn btn-primary wizard-nav__btn" onClick={() => setCurrentStep(s => s + 1)}>
                            Próximo →
                        </button>
                    )}
                    {isLastStep && (
                        <button type="submit" className="btn btn-primary btn-lg wizard-nav__submit" disabled={submitting}>
                            {submitting ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Salvando...</>
                            ) : "Salvar Alterações"}
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
                                    <input type="text" className="form-control" placeholder="Novo valor..." value={novoValorInput} onChange={e => setNovoValorInput(e.target.value)} onKeyDown={e => e.key === "Enter" && salvarNovoItem()} />
                                    <button className="btn btn-success" type="button" onClick={salvarNovoItem}>Adicionar</button>
                                </div>
                            </div>
                            <div className="mb-2">
                                <input type="text" className="form-control form-control-sm" placeholder="🔍 Buscar valor..." value={modalSearch} onChange={e => setModalSearch(e.target.value)} />
                            </div>
                            <div className="text-muted small mb-2">{(opcoesBanco[modalConfig.campoForm] || []).length} valor(es) cadastrado(s)</div>
                            <ul className="wizard-modal-list">
                                {(opcoesBanco[modalConfig.campoForm] || []).length === 0 ? (
                                    <li className="wizard-modal-list__empty">Nenhum valor cadastrado ainda.</li>
                                ) : (
                                    (opcoesBanco[modalConfig.campoForm] || [])
                                        .filter(item => !modalSearch || item.name.toLowerCase().includes(modalSearch.toLowerCase()))
                                        .map(item => (
                                            <li key={item._id} className="wizard-modal-list__item">
                                                <span>{item.name}</span>
                                                <button className="wizard-modal-list__delete" type="button" onClick={() => deletarItem(item._id)} title="Remover">×</button>
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
