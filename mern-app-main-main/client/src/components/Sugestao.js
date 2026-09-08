import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import SearchableSelect from "./SearchableSelect"

const CAMPOS_CORRECAO = [
    { value: "nome", label: "Nome / Nome científico" },
    { value: "descricao", label: "Descrição" },
    { value: "dados", label: "Dados de cultivo / cuidados" },
    { value: "imagens", label: "Imagens" },
    { value: "outra", label: "Outra informação" },
]

const NOVA_INICIAL = {
    name: "", scientificName: "", simpleDescription: "", description: "",
    origin: "", type: "", Filo: "", Classe: "", Ordem: "", Family: "", Genero: "", Especie: "",
}

function CampoTexto({ id, label, value, onChange, textarea = false, maxLength, placeholder = "" }) {
    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold">{label}</label>
            {textarea ? (
                <textarea
                    id={id}
                    className="form-control"
                    rows="3"
                    value={value}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <input
                    id={id}
                    type="text"
                    className="form-control"
                    value={value}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    )
}

export default function Sugestao() {
    usePageTitle("Sugerir Planta / Reportar Erro")
    const [aba, setAba] = useState("nova")

    const [nova, setNova] = useState({ ...NOVA_INICIAL })
    const [plantas, setPlantas] = useState([])
    const [plantaId, setPlantaId] = useState("")
    const [plantaNome, setPlantaNome] = useState("")
    const [campo, setCampo] = useState("")
    const [texto, setTexto] = useState("")

    const [enviando, setEnviando] = useState(false)
    const [ok, setOk] = useState(false)
    const [erro, setErro] = useState("")

    useEffect(() => {
        async function loadPlants() {
            try {
                const res = await fetch(`${API_URL}/plant`)
                if (res.ok) {
                    const data = await res.json()
                    setPlantas(data.map(p => ({
                        _id: p._id,
                        name: p.scientificName ? `${p.name} — ${p.scientificName}` : p.name
                    })))
                }
            } catch { /* lista de plantas indisponivel adia a escolha */ }
        }
        loadPlants()
    }, [])

    function setCampoNova(campo, valor) {
        setNova(prev => ({ ...prev, [campo]: valor }))
    }

    function limparTudo() {
        setNova({ ...NOVA_INICIAL })
        setPlantaId("")
        setPlantaNome("")
        setCampo("")
        setTexto("")
        setOk(false)
        setErro("")
    }

    async function enviar(e) {
        e.preventDefault()
        setEnviando(true)
        setErro("")
        try {
            const payload = aba === "nova"
                ? { tipo: "nova", data: nova }
                : { tipo: "correcao", plantaId, plantaNome, campo, texto: texto.trim() }

            const res = await authFetch(`${API_URL}/suggestions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res) {
                setErro("Sessão expirada. Faça login novamente.")
                return
            }
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setErro(data.message || "Erro ao enviar a sugestão.")
                return
            }
            setOk(true)
        } catch {
            setErro("Erro ao conectar com o servidor.")
        } finally {
            setEnviando(false)
        }
    }

    if (ok) {
        return (
            <div className="container sugestao-page mt-4">
                <div className="text-center py-5">
                    <div className="favorites-page-empty__icon">🎉</div>
                    <h3 className="fw-semibold mb-2">Sugestão enviada!</h3>
                    <p className="text-muted mb-4">
                        Ela entra na fila de revisão e não vai direto ao catálogo. A equipe analisa e, se aprovada, ela é publicada.
                    </p>
                    <Link to="/sugerir" className="btn btn-sm btn-outline-success me-2" onClick={limparTudo}>
                        Enviar outra sugestão
                    </Link>
                    <Link to="/plantlist" className="btn btn-sm btn-success">
                        Explorar o catálogo
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container sugestao-page mt-4">
            <h3 className="plant-list-page__title fw-semibold mb-1">Sugerir planta / Reportar erro</h3>
            <p className="plant-list-page__count mb-4">
                Sua sugestão passa por revisão antes de ser publicada. Apenas texto — fotos podem ser adicionadas depois pela equipe.
            </p>

            <div className="sugestao-tabs mb-4" role="tablist" aria-label="Tipo de sugestão">
                <button
                    type="button"
                    role="tab"
                    aria-selected={aba === "nova"}
                    className={`sugestao-tabs__tab ${aba === "nova" ? "is-active" : ""}`}
                    onClick={() => setAba("nova")}
                >
                    🌱 Sugerir nova planta
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={aba === "correcao"}
                    className={`sugestao-tabs__tab ${aba === "correcao" ? "is-active" : ""}`}
                    onClick={() => setAba("correcao")}
                >
                    ✏️ Reportar erro
                </button>
            </div>

            <form onSubmit={enviar} className="sugestao-form card border-0 p-4 col-lg-8">
                {erro && <div className="alert alert-danger">{erro}</div>}

                {aba === "nova" && (
                    <>
                        <CampoTexto id="nova-name" label="Nome popular *" value={nova.name} onChange={v => setCampoNova("name", v)} maxLength={200} placeholder="Ex.: Hortelã" />
                        <CampoTexto id="nova-sci" label="Nome científico" value={nova.scientificName} onChange={v => setCampoNova("scientificName", v)} maxLength={200} placeholder="Ex.: Mentha spicata" />
                        <CampoTexto id="nova-simples" label="Descrição curta (aparece no catálogo)" value={nova.simpleDescription} onChange={v => setCampoNova("simpleDescription", v)} maxLength={200} />
                        <CampoTexto id="nova-desc" label="Descrição completa" textarea value={nova.description} onChange={v => setCampoNova("description", v)} maxLength={2000} />
                        <div className="row">
                            <div className="col-md-6">
                                <CampoTexto id="nova-origem" label="Origem" value={nova.origin} onChange={v => setCampoNova("origin", v)} maxLength={120} />
                            </div>
                            <div className="col-md-6">
                                <CampoTexto id="nova-tipo" label="Tipo de planta" value={nova.type} onChange={v => setCampoNova("type", v)} maxLength={120} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6"><CampoTexto id="nova-genero" label="Gênero" value={nova.Genero} onChange={v => setCampoNova("Genero", v)} maxLength={120} /></div>
                            <div className="col-md-6"><CampoTexto id="nova-especie" label="Espécie" value={nova.Especie} onChange={v => setCampoNova("Especie", v)} maxLength={120} /></div>
                        </div>
                        <div className="row">
                            <div className="col-md-6"><CampoTexto id="nova-familia" label="Família" value={nova.Family} onChange={v => setCampoNova("Family", v)} maxLength={120} /></div>
                            <div className="col-md-6"><CampoTexto id="nova-ordem" label="Ordem" value={nova.Ordem} onChange={v => setCampoNova("Ordem", v)} maxLength={120} /></div>
                        </div>
                    </>
                )}

                {aba === "correcao" && (
                    <>
                        <div className="mb-3">
                            <label htmlFor="select-planta" className="form-label fw-semibold">Planta com erro *</label>
                            <SearchableSelect
                                campo="planta"
                                placeholder="Buscar planta..."
                                value={plantaId}
                                options={plantas}
                                onChange={(id) => {
                                    setPlantaId(id)
                                    const sel = plantas.find(p => p._id === id)
                                    setPlantaNome(sel ? sel.name : "")
                                }}
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="correcao-campo" className="form-label fw-semibold">O que está errado? *</label>
                            <select id="correcao-campo" className="form-select" value={campo} onChange={e => setCampo(e.target.value)}>
                                <option value="">Selecione...</option>
                                {CAMPOS_CORRECAO.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <CampoTexto
                            id="correcao-texto"
                            label="Descreva o erro *"
                            textarea
                            value={texto}
                            onChange={setTexto}
                            maxLength={2000}
                            placeholder="Explique o que está incorreto e, se possível, informe a informação correta."
                        />
                    </>
                )}

                <div className="d-flex gap-2 mt-2">
                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={enviando || (aba === "nova" ? !nova.name.trim() : (!plantaId || !texto.trim()))}
                    >
                        {enviando ? "Enviando..." : "Enviar sugestão"}
                    </button>
                </div>
            </form>
        </div>
    )
}