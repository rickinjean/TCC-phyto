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
    origin: "", type: "", Family: "", Genero: "", Especie: "",
}

function Secao({ emoji, titulo, dica, children }) {
    return (
        <div className="sugestao-section">
            <div className="sugestao-section__head">
                <span className="sugestao-section__emoji" aria-hidden="true">{emoji}</span>
                <h4 className="sugestao-section__title">{titulo}</h4>
            </div>
            {dica && <p className="sugestao-section__dica">{dica}</p>}
            <div className="sugestao-section__body">{children}</div>
        </div>
    )
}

function CampoTexto({ id, label, value, onChange, textarea = false, maxLength, placeholder = "", obrigatorio = false, contador = false }) {
    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold">
                {label}
                {obrigatorio && <span className="sugestao-required" title="Obrigatório"> *</span>}
            </label>
            {textarea ? (
                <textarea
                    id={id}
                    className="form-control"
                    rows="5"
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
            {contador && <small className="sugestao-charcount">{value.length}/{maxLength}</small>}
        </div>
    )
}

export default function Sugestao() {
    usePageTitle("Sugerir Planta / Reportar Erro")
    const [aba, setAba] = useState("nova")

    const [nova, setNova] = useState({ ...NOVA_INICIAL })
    const [tipos, setTipos] = useState([])
    const [origens, setOrigens] = useState([])
    const [plantas, setPlantas] = useState([])
    const [plantaId, setPlantaId] = useState("")
    const [plantaNome, setPlantaNome] = useState("")
    const [campo, setCampo] = useState("")
    const [texto, setTexto] = useState("")

    const [enviando, setEnviando] = useState(false)
    const [ok, setOk] = useState(false)
    const [erro, setErro] = useState("")

    useEffect(() => {
        async function loadOpcoes() {
            try {
                const [plantRes, typeRes, originRes] = await Promise.all([
                    fetch(`${API_URL}/plant`),
                    fetch(`${API_URL}/collections/type`),
                    fetch(`${API_URL}/collections/origin`)
                ])
                if (plantRes.ok) {
                    const data = await plantRes.json()
                    setPlantas(data.map(p => ({
                        _id: p._id,
                        name: p.scientificName ? `${p.name} — ${p.scientificName}` : p.name
                    })))
                }
                if (typeRes.ok) {
                    const data = await typeRes.json()
                    setTipos(Array.isArray(data) ? data.filter(t => t && t.name) : [])
                }
                if (originRes.ok) {
                    const data = await originRes.json()
                    setOrigens(Array.isArray(data) ? data.filter(o => o && o.name) : [])
                }
            } catch { /* lista de plantas/opções indisponível adia a escolha */ }
        }
        loadOpcoes()
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
            <h3 className="sugestao-page__title mb-1 text-center">Sugerir planta / Reportar erro</h3>
            <p className="sugestao-page__sub mb-4 text-center">
                Sua sugestão passa por revisão antes de ser publicada. Apenas texto — fotos podem ser adicionadas depois pela equipe.
            </p>

            <div className="sugestao-tabs sugestao-tabs--center mb-4" role="tablist" aria-label="Tipo de sugestão">
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

            <form onSubmit={enviar} className="sugestao-form card border-0 p-4 col-lg-8 mx-auto">
                {erro && <div className="alert alert-danger">{erro}</div>}

                {aba === "nova" ? (
                    <>
                        <Secao
                            emoji="🌱"
                            titulo="Identificação"
                            dica="Como a planta é conhecida e uma breve apresentação para o catálogo."
                        >
                            <div className="row">
                                <div className="col-md-6">
                                    <CampoTexto id="nova-name" label="Nome popular" obrigatorio value={nova.name} onChange={v => setCampoNova("name", v)} maxLength={200} placeholder="Ex.: Hortelã" />
                                </div>
                                <div className="col-md-6">
                                    <CampoTexto id="nova-sci" label="Nome científico" value={nova.scientificName} onChange={v => setCampoNova("scientificName", v)} maxLength={200} placeholder="Ex.: Mentha spicata" />
                                </div>
                            </div>
                        </Secao>

                        <Secao
                            emoji="📋"
                            titulo="Classificação"
                            dica="As opções de tipo vêm do catálogo. O restante pode ser complementado pela equipe depois."
                        >
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="nova-tipo" className="form-label fw-semibold">Tipo de planta</label>
                                    <select
                                        id="nova-tipo"
                                        className="form-select"
                                        value={nova.type}
                                        disabled={tipos.length === 0}
                                        onChange={e => setCampoNova("type", e.target.value)}
                                    >
                                        <option value="">Selecione o tipo…</option>
                                        {tipos.map(t => (
                                            <option key={t._id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    {tipos.length === 0 && (
                                        <small className="sugestao-field-hint">
                                            Sem opções de tipo no momento. A equipe complementa depois.
                                        </small>
                                    )}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="nova-origem" className="form-label fw-semibold">Origem</label>
                                    <select
                                        id="nova-origem"
                                        className="form-select"
                                        value={nova.origin}
                                        disabled={origens.length === 0}
                                        onChange={e => setCampoNova("origin", e.target.value)}
                                    >
                                        <option value="">Selecione a origem…</option>
                                        {origens.map(o => (
                                            <option key={o._id} value={o.name}>{o.name}</option>
                                        ))}
                                    </select>
                                    {origens.length === 0 && (
                                        <small className="sugestao-field-hint">
                                            Sem opções de origem no momento. A equipe complementa depois.
                                        </small>
                                    )}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-4"><CampoTexto id="nova-genero" label="Gênero" value={nova.Genero} onChange={v => setCampoNova("Genero", v)} maxLength={120} placeholder="Ex.: Mentha" /></div>
                                <div className="col-md-4"><CampoTexto id="nova-especie" label="Espécie" value={nova.Especie} onChange={v => setCampoNova("Especie", v)} maxLength={120} placeholder="Ex.: spicata" /></div>
                                <div className="col-md-4"><CampoTexto id="nova-familia" label="Família" value={nova.Family} onChange={v => setCampoNova("Family", v)} maxLength={120} placeholder="Ex.: Lamiaceae" /></div>
                            </div>
                        </Secao>

                        <Secao
                            emoji="📝"
                            titulo="Descrição completa"
                            dica="Conte o que você sabe: porte, folhas, flores, frutos, usos e onde costuma aparecer."
                        >
                            <CampoTexto
                                id="nova-simples"
                                label="Descrição curta (aparece no catálogo)"
                                contador
                                value={nova.simpleDescription}
                                onChange={v => setCampoNova("simpleDescription", v)}
                                maxLength={200}
                                placeholder="Ex.: Erva aromática de hortas e quintais."
                            />
                            <CampoTexto
                                id="nova-desc"
                                label="Descrição completa"
                                textarea
                                contador
                                value={nova.description}
                                onChange={v => setCampoNova("description", v)}
                                maxLength={2000}
                                placeholder="Descreva a planta com o máximo de detalhes que souber."
                            />
                        </Secao>
                    </>
                ) : (
                    <Secao
                        emoji="✏️"
                        titulo="Correção"
                        dica="Identifique a planta e descreva o que está errado na ficha."
                    >
                        <div className="mb-3">
                            <label htmlFor="select-planta" className="form-label fw-semibold">Planta com erro <span className="sugestao-required" title="Obrigatório">*</span></label>
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
                            <label htmlFor="correcao-campo" className="form-label fw-semibold">O que está errado? <span className="sugestao-required" title="Obrigatório">*</span></label>
                            <select id="correcao-campo" className="form-select" value={campo} onChange={e => setCampo(e.target.value)}>
                                <option value="">Selecione...</option>
                                {CAMPOS_CORRECAO.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <CampoTexto
                            id="correcao-texto"
                            label="Descreva o erro"
                            obrigatorio
                            textarea
                            contador
                            value={texto}
                            onChange={setTexto}
                            maxLength={2000}
                            placeholder="Explique o que está incorreto e, se possível, informe a informação correta."
                        />
                    </Secao>
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