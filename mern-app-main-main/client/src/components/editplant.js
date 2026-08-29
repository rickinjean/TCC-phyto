import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Popular</label>
                                <input type="text" className={`form-control ${!form.name ? "is-invalid-mild" : ""}`} placeholder="Ex: Espada-de-São-Jorge" value={form.name} onChange={e => updateForm({ name: e.target.value })} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Científico</label>
                                <input type="text" className={`form-control ${!form.scientificName ? "is-invalid-mild" : ""}`} placeholder="Ex: Acorus calamus" value={form.scientificName} onChange={e => updateForm({ scientificName: e.target.value })} />
                            </div>
                            <div className="col-12 mb-3">
                                <FieldLabel optional>Imagens</FieldLabel>
                                <ImageDropZone
                                    imageFiles={imageFiles}
                                    setImageFiles={setImageFiles}
                                    existingImages={existingImages}
                                    setExistingImages={setExistingImages}
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Resumo Rápido</FieldLabel>
                                    <CharacterCounter value={form.simpleDescription || ""} max={TEXT_LIMITS.simpleDescription} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.simpleDescription} placeholder="Uma frase curta sobre a planta..." value={form.simpleDescription} onChange={e => updateForm({ simpleDescription: e.target.value })} />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Descrição Detalhada</FieldLabel>
                                    <CharacterCounter value={form.description || ""} max={TEXT_LIMITS.description} />
                                </div>
                                <textarea className="form-control" rows="4" maxLength={TEXT_LIMITS.description} placeholder="Descrição completa da planta, suas características, usos..." value={form.description} onChange={e => updateForm({ description: e.target.value })} />
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
                            <div className="col-md-4 mb-3"><FieldLabel optional>Fruto</FieldLabel><SelectField campo="fruit" placeholder="Tipo de fruto..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Origem</FieldLabel><SelectField campo="origin" placeholder="Origem geográfica..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Função / Tipo</FieldLabel><SelectField campo="type" placeholder="Função da planta..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Propagação</FieldLabel><SelectField campo="propagation" placeholder="Como se propaga..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Toxicidade</FieldLabel><SelectField campo="toxicity" placeholder="Grau de toxicidade..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Dificuldade</FieldLabel><SelectField campo="dificulty" placeholder="Nível de cuidado..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">Classificação Taxonômica</h5>
                        <div className="row">
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Filo</FieldLabel><input type="text" className="form-control" value={form.Filo} onChange={e => updateForm({ Filo: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Classe</FieldLabel><input type="text" className="form-control" value={form.Classe} onChange={e => updateForm({ Classe: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Ordem</FieldLabel><input type="text" className="form-control" value={form.Ordem} onChange={e => updateForm({ Ordem: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Família</FieldLabel><input type="text" className="form-control" value={form.Family} onChange={e => updateForm({ Family: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Gênero</FieldLabel><input type="text" className="form-control" value={form.Genero} onChange={e => updateForm({ Genero: e.target.value })} placeholder="Digite e saia do campo" /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Espécie</FieldLabel><input type="text" className="form-control" value={form.Especie} onChange={e => updateForm({ Especie: e.target.value })} /></div>
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
                            <div className="col-md-6 mb-3"><FieldLabel optional>Altura / Porte</FieldLabel><SelectField campo="height" placeholder="Porte da planta..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Cor da Flor</FieldLabel><SelectField campo="flowercolor" placeholder="Cores das flores..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Folhagem</FieldLabel><SelectField campo="foliage" placeholder="Tipo de folhagem..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Época de Floração</FieldLabel><SelectField campo="flowering" placeholder="Quando floresce..." /></div>
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
                            <div className="col-md-6 mb-3"><FieldLabel optional>Luminosidade</FieldLabel><SelectField campo="light" placeholder="Necessidade de luz..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Água</FieldLabel><SelectField campo="water" placeholder="Necessidade de água..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Solo</FieldLabel><SelectField campo="soil" placeholder="Tipo de solo..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Tamanho</FieldLabel><SelectField campo="size" placeholder="Tamanho recomendado..." /></div>
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
                                    <FieldLabel optional>Rega</FieldLabel>
                                    <CharacterCounter value={form.watering || ""} max={TEXT_LIMITS.watering} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.watering} placeholder="Como regar esta planta..." value={form.watering} onChange={e => updateForm({ watering: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Melhor Horário</FieldLabel><SelectField campo="manha" placeholder="Horário ideal..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Quantidade</FieldLabel><SelectField campo="amount" placeholder="Quantidade..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">✂️ Poda</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Poda</FieldLabel>
                                    <CharacterCounter value={form.pruning || ""} max={TEXT_LIMITS.pruning} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pruning} placeholder="Como podar..." value={form.pruning} onChange={e => updateForm({ pruning: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Época</FieldLabel><SelectField campo="season" placeholder="Época da poda..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Ferramentas</FieldLabel><SelectField campo="tools" placeholder="Ferramentas..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🐛 Pragas e Doenças</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Pragas e Doenças</FieldLabel>
                                    <CharacterCounter value={form.pests || ""} max={TEXT_LIMITS.pests} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pests} placeholder="Pragas comuns e tratamento..." value={form.pests} onChange={e => updateForm({ pests: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Prevenção</FieldLabel><SelectField campo="prevention" placeholder="Nível de prevenção..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Monitoramento</FieldLabel><SelectField campo="monitoring" placeholder="Monitoramento..." /></div>
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
                                    <FieldLabel optional>Plantio</FieldLabel>
                                    <CharacterCounter value={form.planting || ""} max={TEXT_LIMITS.planting} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.planting} placeholder="Como plantar..." value={form.planting} onChange={e => updateForm({ planting: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Estação</FieldLabel><SelectField campo="station" placeholder="Estação de plantio..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Espaçamento</FieldLabel><SelectField campo="spacing" placeholder="Espaçamento entre mudas..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">☀️ Exposição Solar</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Exposição Solar</FieldLabel>
                                    <CharacterCounter value={form.exhibition || ""} max={TEXT_LIMITS.exhibition} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.exhibition} placeholder="Condições de exposição solar..." value={form.exhibition} onChange={e => updateForm({ exhibition: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Horas de Sol</FieldLabel><SelectField campo="iluminosity" placeholder="Horas diárias..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Proteção</FieldLabel><SelectField campo="protection" placeholder="Proteção climática..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🔧 Manutenção</h5>
                        <div className="row">
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end">
                                    <FieldLabel optional>Manutenção</FieldLabel>
                                    <CharacterCounter value={form.maintenance || ""} max={TEXT_LIMITS.maintenance} />
                                </div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.maintenance} placeholder="Práticas de manutenção..." value={form.maintenance} onChange={e => updateForm({ maintenance: e.target.value })} />
                            </div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Temperatura Ideal</FieldLabel><SelectField campo="idealTemperature" placeholder="Temperatura..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Tolerância</FieldLabel><SelectField campo="tolerance" placeholder="Tolerância..." /></div>
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
