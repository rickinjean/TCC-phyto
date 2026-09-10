import { Link } from "react-router-dom"
import SearchableSelect from "./SearchableSelect"
import { encodeId } from "../idCodec"
import { STATUS_LABEL, formatarData } from "../sugestaoUtils"

export const CAMPOS_CORRECAO = [
    { value: "nome", label: "Nome / Nome científico" },
    { value: "descricao", label: "Descrição" },
    { value: "dados", label: "Dados de cultivo / cuidados" },
    { value: "imagens", label: "Imagens" },
    { value: "outra", label: "Outra informação" },
]

export const NOVA_INICIAL = {
    name: "", scientificName: "", simpleDescription: "", description: "",
    origin: "", type: "", Family: "", Genero: "", Especie: "",
}

export function Secao({ emoji, titulo, dica, children }) {
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

export function CampoTexto({ id, label, value, onChange, textarea = false, maxLength, placeholder = "", obrigatorio = false, contador = false }) {
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

export function FormNovaPlanta({ nova, tipos, origens, setCampoNova }) {
    return (
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
    )
}

export function FormCorrecao({ plantas, plantaId, onPlanta, campo, onCampo, texto, onTexto }) {
    return (
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
                    onChange={onPlanta}
                />
            </div>
            <div className="mb-3">
                <label htmlFor="correcao-campo" className="form-label fw-semibold">O que está errado? <span className="sugestao-required" title="Obrigatório">*</span></label>
                <select id="correcao-campo" className="form-select" value={campo} onChange={e => onCampo(e.target.value)}>
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
                onChange={onTexto}
                maxLength={2000}
                placeholder="Explique o que está incorreto e, se possível, informe a informação correta."
            />
        </Secao>
    )
}

export function MinhasSugestoes({ minhas, carregando, erro, onAtualizar }) {
    return (
        <div className="sugestao-form card border-0 p-4 col-lg-8 mx-auto">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="fw-semibold mb-0">📬 Minhas sugestões</h4>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAtualizar}>
                    Atualizar
                </button>
            </div>
            <p className="sugestao-page__sub text-muted small mb-3">
                Acompanhe o status: pendente, em processo, rejeitada ou publicada no catálogo.
                Encerradas (publicadas ou rejeitadas) são removidas após 30 dias.
            </p>

            {carregando ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando suas sugestões...
                </div>
            ) : erro ? (
                <div className="alert alert-danger">{erro}</div>
            ) : minhas.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="fas fa-inbox fa-2x mb-3 d-block" style={{ opacity: 0.3 }}></i>
                    Você ainda não enviou sugestões.
                </div>
            ) : (
                <div className="minhas-sugestoes">
                    {minhas.map(s => (
                        <div key={String(s._id)} className="minhas-sugestoes__card">
                            <div className="admin-message-card__meta">
                                <span className="admin-message-card__name">
                                    {s.tipo === "nova"
                                        ? (s.data && s.data.name) || "Nova planta"
                                        : s.plantaNome || "Correção"}
                                </span>
                                <span className={`sugestao-badge sugestao-badge--${s.status}`}>
                                    {STATUS_LABEL[s.status] || s.status}
                                </span>
                            </div>
                            <div className="admin-message-card__meta">
                                <span className="admin-message-card__date">{formatarData(s.created)}</span>
                                <span>{s.tipo === "nova" ? "🌱 Nova planta" : "✏️ Correção"}</span>
                            </div>
                            {s.campo && <div className="minhas-sugestoes__linha"><strong>Campo:</strong> {s.campo}</div>}
                            {s.texto && <p className="minhas-sugestoes__texto">{s.texto}</p>}
                            {s.tipo === "nova" && s.status === "concluida" && s.plantaCriadaId && (
                                <Link to={`/plantdetails/${encodeId(s.plantaCriadaId)}`} className="btn btn-sm btn-success mt-2">
                                    Ver ficha no catálogo
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}