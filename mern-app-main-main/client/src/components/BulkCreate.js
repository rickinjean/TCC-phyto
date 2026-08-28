import React, { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import mapeamentoColecoes from "../mapeamentoColecoes"
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

const TEXT_LIMITS = {
    simpleDescription: 200, description: 2000,
    watering: 500, fertilizing: 500, pruning: 500, pests: 500,
    planting: 500, exhibition: 500, maintenance: 500,
}

function ImageDropZone({ imageFiles, setImageFiles }) {
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef()
    const objectUrls = useRef([])

    useEffect(() => {
        objectUrls.current = imageFiles.map(f => URL.createObjectURL(f))
        return () => { objectUrls.current.forEach(url => URL.revokeObjectURL(url)); objectUrls.current = [] }
    }, [imageFiles])

    function handleDrop(e) { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))) }
    function addFiles(newFiles) {
        setImageFiles(prev => {
            const merged = [...prev]
            for (const file of newFiles) { if (merged.length >= 5) break; if (!merged.some(f => f.name === file.name && f.size === file.size)) merged.push(file) }
            return merged
        })
    }
    function removeFile(index) { setImageFiles(prev => prev.filter((_, i) => i !== index)) }

    return (
        <div className={`image-drop-zone ${dragging ? "image-drop-zone--active" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" multiple accept="image/*" className="d-none" onChange={e => addFiles(Array.from(e.target.files))} />
            {imageFiles.length === 0 ? <p className="image-drop-zone__hint">Arraste imagens aqui ou clique para selecionar</p> : (
                <div className="image-drop-zone__previews">{imageFiles.map((f, i) => (
                    <div key={i} className="image-drop-zone__thumb-wrap">
                        <img src={URL.createObjectURL(f)} alt={f.name} className="image-drop-zone__thumb" />
                        <button type="button" className="image-drop-zone__remove" onClick={e => { e.stopPropagation(); removeFile(i) }}>×</button>
                    </div>
                ))}</div>
            )}
        </div>
    )
}

function FieldLabel({ children, optional }) {
    return <label className="wizard-label">{children} {optional && <span className="text-muted fw-normal">(opcional)</span>}</label>
}

function CharacterCounter({ value, max }) {
    const len = value.length
    return <small className={`text-muted ${len > max * 0.9 ? "text-warning" : ""}`}>{len}/{max}</small>
}

export default function BulkCreate() {
    const [form, setForm] = useState(INITIAL_FORM)
    const [imageFiles, setImageFiles] = useState([])
    const [currentStep, setCurrentStep] = useState(0)
    const [opcoesBanco, setOpcoesBanco] = useState({})
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState(null)
    const [modalConfig, setModalConfig] = useState(null)
    const [novoValorInput, setNovoValorInput] = useState("")
    const [modalSearch, setModalSearch] = useState("")
    const navigate = useNavigate()

    const [totalCreated, setTotalCreated] = useState(0)
    const [errors, setErrors] = useState([])
    const [finished, setFinished] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const res = await fetch(`${API_URL}/collections/all`)
                if (res.ok) {
                    const all = await res.json()
                    const mapped = {}
                    for (const [key, meta] of Object.entries(mapeamentoColecoes)) mapped[key] = all[meta.colecao] || []
                    setOpcoesBanco(mapped)
                }
            } catch (err) { console.error("Erro ao carregar coleções:", err) }
            setLoading(false)
        }
        load()
    }, [])

    function showToast(message, type = "success") { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }
    function updateForm(value) { setForm(prev => ({ ...prev, ...value })) }

    function abrirModalPara(campo) {
        setModalConfig({ campoForm: campo, colecaoMongo: mapeamentoColecoes[campo].colecao, labelAmigavel: mapeamentoColecoes[campo].label })
        setNovoValorInput(""); setModalSearch("")
    }

    async function salvarNovoItem() {
        if (!novoValorInput.trim()) return
        try {
            const response = await authFetch(`${API_URL}/collections/${modalConfig.colecaoMongo}/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: novoValorInput }) })
            if (!response || !response.ok) { const err = response ? await response.json().catch(() => ({})) : {}; showToast(err.message || "Erro ao salvar", "error"); return }
            const item = await response.json()
            setOpcoesBanco(prev => ({ ...prev, [modalConfig.campoForm]: [...(prev[modalConfig.campoForm] || []), item] }))
            updateForm({ [modalConfig.campoForm]: item._id }); setNovoValorInput(""); showToast(`"${item.name}" adicionado!`)
            const btn = document.querySelector('#modalDinamico [data-bs-dismiss="modal"]'); if (btn) btn.click()
        } catch { showToast("Erro ao conectar ao servidor", "error") }
    }

    async function deletarItem(idItem) {
        try {
            const response = await authFetch(`${API_URL}/collections/${modalConfig.colecaoMongo}/${idItem}`, { method: "DELETE" })
            if (!response || !response.ok) { showToast("Erro ao deletar", "error"); return }
            setOpcoesBanco(prev => ({ ...prev, [modalConfig.campoForm]: prev[modalConfig.campoForm].filter(i => i._id !== idItem) }))
            if (form[modalConfig.campoForm] === idItem) updateForm({ [modalConfig.campoForm]: "" })
            showToast("Item removido!")
        } catch { showToast("Erro ao conectar ao servidor", "error") }
    }

    async function savePlant() {
        setSaving(true)
        const formData = new FormData()
        Object.keys(form).forEach(key => formData.append(key, form[key]))
        imageFiles.forEach(file => formData.append("images", file))
        try {
            const token = localStorage.getItem("token")
            const headers = {}
            if (token) headers.Authorization = `Bearer ${token}`
            const response = await fetch(`${API_URL}/plant/add`, { method: "POST", headers, body: formData })
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                setErrors(prev => [...prev, { name: form.name || `Planta #${totalCreated + 1}`, message: err.message || "Erro ao cadastrar" }])
                showToast(err.message || "Erro ao cadastrar", "error")
                setSaving(false)
                return false
            }
            setTotalCreated(prev => prev + 1)
            showToast(`"${form.name}" cadastrada com sucesso!`)
            setSaving(false)
            return true
        } catch {
            setErrors(prev => [...prev, { name: form.name || `Planta #${totalCreated + 1}`, message: "Erro ao conectar ao servidor" }])
            showToast("Erro ao conectar ao servidor", "error")
            setSaving(false)
            return false
        }
    }

    async function handleSaveAndNext() {
        const ok = await savePlant()
        if (ok) {
            setForm(INITIAL_FORM)
            setImageFiles([])
            setCurrentStep(0)
        }
    }

    function handleFinish() { setFinished(true) }

    function SelectField({ campo, placeholder }) {
        return <SearchableSelect campo={campo} placeholder={placeholder} value={form[campo]} options={opcoesBanco[campo] || []} onChange={id => updateForm({ [campo]: id })} onManage={() => abrirModalPara(campo)} />
    }

    const isReviewStep = currentStep === STEPS.length - 1
    const requiredForStep = currentStep === 0 ? ["name", "scientificName"] : []
    const stepErrors = requiredForStep.filter(field => !form[field])

    const previewUrl = useMemo(() => { if (imageFiles.length === 0) return null; return URL.createObjectURL(imageFiles[0]) }, [imageFiles])
    useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) } }, [previewUrl])

    function goToStep(next) { setCurrentStep(next) }

    if (loading) {
        return (
            <div className="admin-page admin-page--plant-form container mt-4">
                <div className="wizard-loading"><div className="spinner-border" role="status" /><p>Carregando opções...</p></div>
            </div>
        )
    }

    if (finished) {
        return (
            <div className="admin-page container mt-4 mb-5">
                <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-5">
                        <div style={{ fontSize: "3rem" }}>✅</div>
                        <h3 className="mt-3">Lote finalizado!</h3>
                        <p className="text-muted">
                            <strong>{totalCreated}</strong> {totalCreated === 1 ? "planta cadastrada" : "plantas cadastradas"} com sucesso
                            {errors.length > 0 && <>, <strong className="text-danger">{errors.length}</strong> {errors.length === 1 ? "erro" : "erros"}</>}
                        </p>
                        {errors.length > 0 && (
                            <div className="mt-3 text-start">
                                <h6 className="text-danger">Erros:</h6>
                                <ul className="list-group list-group-flush">
                                    {errors.map((e, i) => <li key={i} className="list-group-item text-danger">{e.name}: {e.message}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <button className="btn btn-primary" onClick={() => navigate("/plantlist")}>Ver plantas cadastradas</button>
                            <button className="btn btn-outline-secondary" onClick={() => { setTotalCreated(0); setErrors([]); setFinished(false); setForm(INITIAL_FORM); setImageFiles([]); setCurrentStep(0) }}>Cadastrar mais</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-page admin-page--plant-form container mt-4">
            {toast && <div className={`wizard-toast wizard-toast--${toast.type}`}>{toast.type === "success" ? "✓" : "✕"} {toast.message}</div>}

            <div className="wizard-header">
                <div>
                    <h3 className="admin-page__title">Cadastrar em Lote</h3>
                    <small className="text-muted">{totalCreated} {totalCreated === 1 ? "planta cadastrada" : "plantas cadastradas"}</small>
                </div>
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/plantlist")}>← Voltar</button>
                    <button type="button" className="btn btn-sm btn-success" onClick={handleFinish}>✅ Finalizar lote</button>
                </div>
            </div>

            <div className="wizard-progress mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="wizard-progress__label">Planta atual — Etapa {currentStep + 1} de {STEPS.length}</span>
                </div>
                <div className="wizard-progress__bar">
                    <div className="wizard-progress__fill" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
                </div>
            </div>

            <div className="wizard-stepper">
                {STEPS.map((step, i) => (
                    <button key={step.key} type="button" className={`wizard-stepper__step ${i === currentStep ? "wizard-stepper__step--active" : ""} ${i < currentStep ? "wizard-stepper__step--done" : ""}`} onClick={() => goToStep(i)}>
                        <span className="wizard-stepper__number">{i < currentStep ? "✓" : step.icon}</span>
                        <span className="wizard-stepper__label">{step.label}</span>
                    </button>
                ))}
                <div className="wizard-stepper__track">
                    <div className="wizard-stepper__progress" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
                </div>
            </div>

            <form className="plant-admin-form wizard-form" onSubmit={e => e.preventDefault()}>
                {/* STEP 0: DADOS BÁSICOS */}
                {currentStep === 0 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>🌱 Dados Básicos</h4><p>Nome, imagem e descrição da planta</p></div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Popular <span className="text-danger">*</span></label>
                                <input type="text" className={`form-control ${!form.name ? "is-invalid-mild" : ""}`} placeholder="Ex: Espada-de-São-Jorge" value={form.name} onChange={e => updateForm({ name: e.target.value })} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="wizard-label">Nome Científico <span className="text-danger">*</span></label>
                                <input type="text" className={`form-control ${!form.scientificName ? "is-invalid-mild" : ""}`} placeholder="Ex: Acorus calamus" value={form.scientificName} onChange={e => updateForm({ scientificName: e.target.value })} required />
                            </div>
                            <div className="col-12 mb-3">
                                <FieldLabel optional>Imagens</FieldLabel>
                                <ImageDropZone imageFiles={imageFiles} setImageFiles={setImageFiles} />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end"><FieldLabel optional>Resumo Rápido</FieldLabel><CharacterCounter value={form.simpleDescription || ""} max={TEXT_LIMITS.simpleDescription} /></div>
                                <textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.simpleDescription} placeholder="Uma frase curta sobre a planta..." value={form.simpleDescription} onChange={e => updateForm({ simpleDescription: e.target.value })} />
                            </div>
                            <div className="col-12 mb-3">
                                <div className="d-flex justify-content-between align-items-end"><FieldLabel optional>Descrição Detalhada</FieldLabel><CharacterCounter value={form.description || ""} max={TEXT_LIMITS.description} /></div>
                                <textarea className="form-control" rows="4" maxLength={TEXT_LIMITS.description} placeholder="Descrição completa da planta..." value={form.description} onChange={e => updateForm({ description: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: BOTÂNICA */}
                {currentStep === 1 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>🌿 Informações Botânicas</h4><p>Classificação, origem e características gerais</p></div>
                        <div className="row">
                            <div className="col-md-4 mb-3"><FieldLabel optional>Fruto</FieldLabel><SelectField campo="fruit" placeholder="Tipo de fruto..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Origem</FieldLabel><SelectField campo="origin" placeholder="Origem geográfica..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Função / Tipo</FieldLabel><SelectField campo="type" placeholder="Função da planta..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Propagação</FieldLabel><SelectField campo="propagation" placeholder="Como se propaga..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Toxicidade</FieldLabel><SelectField campo="toxicity" placeholder="Grau de toxicidade..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Dificuldade</FieldLabel><SelectField campo="dificulty" placeholder="Nível de cuidado..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">Classificação Taxonômica</h5>
                        <div className="row mt-2">
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Filo</FieldLabel><input type="text" className="form-control" value={form.Filo} onChange={e => updateForm({ Filo: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Classe</FieldLabel><input type="text" className="form-control" value={form.Classe} onChange={e => updateForm({ Classe: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Ordem</FieldLabel><input type="text" className="form-control" value={form.Ordem} onChange={e => updateForm({ Ordem: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Família</FieldLabel><input type="text" className="form-control" value={form.Family} onChange={e => updateForm({ Family: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Gênero</FieldLabel><input type="text" className="form-control" value={form.Genero} onChange={e => updateForm({ Genero: e.target.value })} /></div>
                            <div className="col-md-2 col-4 mb-3"><FieldLabel optional>Espécie</FieldLabel><input type="text" className="form-control" value={form.Especie} onChange={e => updateForm({ Especie: e.target.value })} /></div>
                        </div>
                    </div>
                )}

                {/* STEP 2: CARACTERÍSTICAS FÍSICAS */}
                {currentStep === 2 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>🍂 Características Físicas</h4><p>Aparência visual da planta</p></div>
                        <div className="row">
                            <div className="col-md-6 mb-3"><FieldLabel optional>Altura / Porte</FieldLabel><SelectField campo="height" placeholder="Porte da planta..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Cor da Flor</FieldLabel><SelectField campo="flowercolor" placeholder="Cores das flores..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Folhagem</FieldLabel><SelectField campo="foliage" placeholder="Tipo de folhagem..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Época de Floração</FieldLabel><SelectField campo="flowering" placeholder="Quando floresce..." /></div>
                        </div>
                    </div>
                )}

                {/* STEP 3: NECESSIDADES AMBIENTAIS */}
                {currentStep === 3 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>☀️ Necessidades Ambientais</h4><p>Condições ideais de cultivo</p></div>
                        <div className="row">
                            <div className="col-md-6 mb-3"><FieldLabel optional>Luminosidade</FieldLabel><SelectField campo="light" placeholder="Necessidade de luz..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Água</FieldLabel><SelectField campo="water" placeholder="Necessidade de água..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Solo</FieldLabel><SelectField campo="soil" placeholder="Tipo de solo..." /></div>
                            <div className="col-md-6 mb-3"><FieldLabel optional>Tamanho</FieldLabel><SelectField campo="size" placeholder="Tamanho recomendado..." /></div>
                        </div>
                    </div>
                )}

                {/* STEP 4: CUIDADOS */}
                {currentStep === 4 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>🤲 Cuidados da Planta</h4><p>Rega, adubação, poda e pragas</p></div>
                        <h5 className="wizard-subtitle">💧 Rega</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.watering || ""} max={TEXT_LIMITS.watering} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.watering} placeholder="Como regar esta planta..." value={form.watering} onChange={e => updateForm({ watering: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Melhor Horário</FieldLabel><SelectField campo="manha" placeholder="Horário ideal..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Quantidade</FieldLabel><SelectField campo="amount" placeholder="Quantidade..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🧪 Fertilização</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.fertilizing || ""} max={TEXT_LIMITS.fertilizing} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.fertilizing} placeholder="Como adubar..." value={form.fertilizing} onChange={e => updateForm({ fertilizing: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Frequência</FieldLabel><SelectField campo="frequency" placeholder="Frequência..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>NPK</FieldLabel><SelectField campo="NPK" placeholder="Tipo de NPK..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">✂️ Poda</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.pruning || ""} max={TEXT_LIMITS.pruning} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pruning} placeholder="Como podar..." value={form.pruning} onChange={e => updateForm({ pruning: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Época</FieldLabel><SelectField campo="season" placeholder="Época da poda..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Ferramentas</FieldLabel><SelectField campo="tools" placeholder="Ferramentas..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🐛 Pragas e Doenças</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.pests || ""} max={TEXT_LIMITS.pests} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.pests} placeholder="Pragas comuns e tratamento..." value={form.pests} onChange={e => updateForm({ pests: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Prevenção</FieldLabel><SelectField campo="prevention" placeholder="Nível de prevenção..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Monitoramento</FieldLabel><SelectField campo="monitoring" placeholder="Monitoramento..." /></div>
                        </div>
                    </div>
                )}

                {/* STEP 5: CULTIVO */}
                {currentStep === 5 && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>🌾 Cultivo da Planta</h4><p>Plantio, exposição e manutenção</p></div>
                        <h5 className="wizard-subtitle">🌱 Plantio</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.planting || ""} max={TEXT_LIMITS.planting} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.planting} placeholder="Como plantar..." value={form.planting} onChange={e => updateForm({ planting: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Estação</FieldLabel><SelectField campo="station" placeholder="Estação de plantio..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Espaçamento</FieldLabel><SelectField campo="spacing" placeholder="Espaçamento entre mudas..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">☀️ Exposição Solar</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.exhibition || ""} max={TEXT_LIMITS.exhibition} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.exhibition} placeholder="Condições de exposição solar..." value={form.exhibition} onChange={e => updateForm({ exhibition: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Horas de Sol</FieldLabel><SelectField campo="iluminosity" placeholder="Horas diárias..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Proteção</FieldLabel><SelectField campo="protection" placeholder="Proteção climática..." /></div>
                        </div>
                        <h5 className="wizard-subtitle">🔧 Manutenção</h5>
                        <div className="row">
                            <div className="col-12 mb-3"><div className="d-flex justify-content-end"><CharacterCounter value={form.maintenance || ""} max={TEXT_LIMITS.maintenance} /></div><textarea className="form-control" rows="2" maxLength={TEXT_LIMITS.maintenance} placeholder="Práticas de manutenção..." value={form.maintenance} onChange={e => updateForm({ maintenance: e.target.value })} /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Temperatura Ideal</FieldLabel><SelectField campo="idealTemperature" placeholder="Temperatura..." /></div>
                            <div className="col-md-4 mb-3"><FieldLabel optional>Tolerância</FieldLabel><SelectField campo="tolerance" placeholder="Tolerância..." /></div>
                        </div>
                    </div>
                )}

                {/* STEP 6: REVISÃO */}
                {isReviewStep && (
                    <div className="wizard-step-content">
                        <div className="wizard-step-header"><h4>✅ Revisão</h4><p>Confira antes de salvar esta planta</p></div>
                        <div className="plant-review">
                            <div className="plant-review__card card mb-3">
                                <div className="plant-review__image-wrap">
                                    {previewUrl ? <img src={previewUrl} alt="Preview" className="plant-review__image" /> : <span className="plant-review__no-image">Sem imagem</span>}
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title fw-semibold">{form.name || "—"}</h5>
                                    <p className="fst-italic text-muted mb-2">{form.scientificName || "—"}</p>
                                </div>
                            </div>
                            <div className="plant-review__summary">
                                {form.description && <><h6 className="fw-bold">Descrição</h6><p>{form.description}</p></>}
                                {form.simpleDescription && <><h6 className="fw-bold">Resumo Rápido</h6><p>{form.simpleDescription}</p></>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── NAVEGAÇÃO ── */}
                <div className="wizard-nav d-flex justify-content-between mt-4">
                    <button type="button" className="btn btn-outline-secondary" disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}>← Anterior</button>
                    <div className="d-flex gap-2">
                        {currentStep < STEPS.length - 1 && (
                            <button type="button" className="btn btn-primary" disabled={stepErrors.length > 0} onClick={() => setCurrentStep(s => s + 1)}>Próximo →</button>
                        )}
                        {isReviewStep && (
                            <>
                                <button type="button" className="btn btn-success" onClick={handleSaveAndNext} disabled={saving}>
                                    {saving ? <><span className="spinner-border spinner-border-sm me-1" /> Salvando...</> : "💾 Salvar e Próxima"}
                                </button>
                                <button type="button" className="btn btn-outline-success" onClick={handleFinish}>✅ Finalizar lote</button>
                            </>
                        )}
                    </div>
                </div>
            </form>

            {/* ── MODAL: GERENCIAR COLEÇÕES ── */}
            {modalConfig && (
                <div className="modal fade" id="modalDinamico" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Gerenciar: {modalConfig.labelAmigavel}</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" />
                            </div>
                            <div className="modal-body">
                                <div className="input-group mb-3">
                                    <input type="text" className="form-control" placeholder="Novo item..." value={novoValorInput} onChange={e => setNovoValorInput(e.target.value)} onKeyDown={e => e.key === "Enter" && salvarNovoItem()} />
                                    <button className="btn btn-success" onClick={salvarNovoItem}>Adicionar</button>
                                </div>
                                <input type="text" className="form-control mb-2" placeholder="Buscar..." value={modalSearch} onChange={e => setModalSearch(e.target.value)} />
                                <ul className="list-group">
                                    {(opcoesBanco[modalConfig.campoForm] || []).filter(item => !modalSearch || item.name.toLowerCase().includes(modalSearch.toLowerCase())).map(item => (
                                        <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>{item.name}</span>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deletarItem(item._id)}>Excluir</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
