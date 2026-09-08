import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import PreviaFicha from "./PreviaFicha"

const STATUS_LABEL = {
    pendente: "Pendente",
    aprovada: "Em processo",
    rejeitada: "Rejeitada",
    concluida: "Concluída",
}

const TIPO_LABEL = {
    nova: "Nova planta",
    correcao: "Correção",
}

function formatarData(iso) {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    })
}

function SugestaoCard({ sug, acoes }) {
    const [expanded, setExpanded] = useState(false)
    const [anotacao, setAnotacao] = useState(sug.anotacao || "")
    const [working, setWorking] = useState(false)

    const ehNova = sug.tipo === "nova"
    const d = sug.data || {}

    async function executar(acao, valorAnotacao) {
        setWorking(true)
        await acoes.executar(sug, acao, valorAnotacao === undefined ? anotacao : valorAnotacao)
        setWorking(false)
    }

    return (
        <div className="admin-message-card">
            <div
                className="admin-message-card__header"
                onClick={() => setExpanded(!expanded)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
            >
                <div className="admin-message-card__meta">
                    <span className="admin-message-card__name">
                        {ehNova ? d.name || "Sem nome" : sug.plantaNome || "Correção"}
                    </span>
                    <span className={`sugestao-badge sugestao-badge--${sug.status}`}>
                        {TIPO_LABEL[sug.tipo] || sug.tipo} · {STATUS_LABEL[sug.status] || sug.status}
                    </span>
                </div>
                <div className="admin-message-card__meta">
                    <span className="admin-message-card__date">{formatarData(sug.created)}</span>
                    <span className={`admin-message-card__chevron ${expanded ? "is-open" : ""}`} aria-hidden="true">›</span>
                </div>
            </div>

            {expanded && (
                <div className="admin-message-card__body">
                    <div className="admin-message-card__fields">
                        <div><strong>Enviado por:</strong> {sug.userName || "—"}</div>
                        <div><strong>Status:</strong> {STATUS_LABEL[sug.status]}</div>
                        {!ehNova && sug.campo && <div><strong>Campo:</strong> {sug.campo}</div>}
                        {sug.plantaCriadaId && (
                            <div>
                                <strong>Planta publicada:</strong>{" "}
                                <Link to={`/editplant/${sug.plantaCriadaId}`}>abrir ficha</Link>
                            </div>
                        )}
                    </div>

                    {ehNova ? (
                        <div className="sugestao-card__detalhes">
                            <div><strong>Nome científico:</strong> {d.scientificName || "—"}</div>
                            <div><strong>Descrição curta:</strong> {d.simpleDescription || "—"}</div>
                            <div><strong>Descrição:</strong> {d.description || "—"}</div>
                            <div><strong>Origem / Tipo:</strong> {[d.origin, d.type].filter(Boolean).join(" · ") || "—"}</div>
                            <div>
                                <strong>Taxonomia:</strong>{" "}
                                {[d.Genero, d.Especie, d.Family, d.Ordem].filter(Boolean).join(" · ") || "—"}
                            </div>
                        </div>
                    ) : (
                        <p className="admin-message-card__text">{sug.texto || "—"}</p>
                    )}

                    {sug.anotacao && (
                        <p className="sugestao-card__nota"><strong>Nota ADM:</strong> {sug.anotacao}</p>
                    )}

                    <div className="sugestao-card__acoes">
                        {!ehNova && (sug.status === "pendente" || sug.status === "aprovada") && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={working}
                                onClick={() => acoes.onPrevia(sug)}
                            >
                                👁️ Ver ficha
                            </button>
                        )}
                        {ehNova && sug.status === "aprovada" && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={working}
                                onClick={() => acoes.onEditar(sug)}
                            >
                                ✏️ Editar dados
                            </button>
                        )}
                        <label htmlFor={`anotacao-${sug._id}`} className="visually-hidden">Anotação</label>
                        <input
                            id={`anotacao-${sug._id}`}
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Anotação opcional"
                            value={anotacao}
                            onChange={(e) => setAnotacao(e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-sm btn-success"
                            disabled={working}
                            onClick={() => executar(sug.status === "pendente" ? "aprovar" : ehNova ? "publicar" : "concluir")}
                        >
                            {sug.status === "pendente"
                                ? "Aprovar → Em processo"
                                : ehNova
                                    ? "Publicar no catálogo"
                                    : "Marcar como corrigida"}
                        </button>
                        {sug.status === "aprovada" && (
                            <button type="button" className="btn btn-sm btn-outline-success" disabled={working} onClick={() => executar("rejeitar")}>
                                Rejeitar
                            </button>
                        )}
                        {(sug.status === "aprovada" || sug.status === "pendente") && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={working} onClick={() => executar("voltar")}>
                                Voltar para pendente
                            </button>
                        )}
                        {sug.status === "pendente" && (
                            <button type="button" className="btn btn-sm btn-outline-danger" disabled={working} onClick={() => executar("rejeitar")}>
                                Rejeitar
                            </button>
                        )}
                        {sug.status !== "pendente" && sug.status !== "aprovada" && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={working} onClick={() => executar("voltar")}>
                                Reabrir
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function SugestaoModeracao() {
    usePageTitle("Moderar Sugestões")
    const navigate = useNavigate()
    const [todas, setTodas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [aba, setAba] = useState("pendente")
    const [filtroTipo, setFiltroTipo] = useState("todos")
    const [aviso, setAviso] = useState("")
    const [previaSug, setPreviaSug] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch(`${API_URL}/suggestions`)
                if (!res) {
                    setError("Sessão expirada. Faça login novamente.")
                    return
                }
                if (!res.ok) {
                    setError(`Erro ao carregar sugestões: ${res.status}`)
                    return
                }
                setTodas(await res.json())
            } catch {
                setError("Erro ao conectar com o servidor")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const visiveis = filtroTipo === "todos" ? todas : todas.filter(s => s.tipo === filtroTipo)
    const pendentes = visiveis.filter(s => s.status === "pendente")
    const emProcesso = visiveis.filter(s => s.status === "aprovada")
    const encerradas = visiveis.filter(s => s.status === "rejeitada" || s.status === "concluida")

    async function executar(sug, acao, anotacao) {
        setAviso("")
        try {
            let res
            if (acao === "publicar") {
                if (!window.confirm("Publicar esta planta no catálogo com os dados sugeridos? Ela ficará visível para todos.")) return
                res = await authFetch(`${API_URL}/suggestions/${sug._id}/publicar`, { method: "POST" })
            } else {
                const status = acao === "aprovar" ? "aprovada"
                    : acao === "concluir" ? "concluida"
                        : acao === "rejeitar" ? "rejeitada"
                            : "pendente"
                res = await authFetch(`${API_URL}/suggestions/${sug._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status, anotacao })
                })
            }

            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setError(data.message || "Erro ao atualizar a sugestão.")
                return
            }

            const novoStatus = acao === "publicar" || acao === "concluir" ? "concluida"
                : acao === "aprovar" ? "aprovada"
                    : acao === "rejeitar" ? "rejeitada"
                        : "pendente"

            setTodas(prev => prev.map(s => {
                if (s._id !== sug._id) return s
                if (acao === "publicar") {
                    return { ...s, status: "concluida", anotacao, plantaCriadaId: data.plantId }
                }
                return { ...s, status: novoStatus, anotacao }
            }))

            if (acao === "publicar") setAviso(`Planta publicada no catálogo! Abra a ficha em edição para completar os dados.`)
        } catch {
            setError("Erro ao conectar com o servidor")
        }
    }

    const listaAtual = aba === "pendente" ? pendentes : aba === "aprovada" ? emProcesso : encerradas

    return (
        <div className="admin-page admin-page--messages">
            <h3 className="admin-page__title ps-2">Moderar Sugestões</h3>

            <div className="sugestao-tabs mb-3 mx-2">
                <button type="button" className={`sugestao-tabs__tab ${aba === "pendente" ? "is-active" : ""}`} onClick={() => setAba("pendente")}>
                    Pendentes ({pendentes.length})
                </button>
                <button type="button" className={`sugestao-tabs__tab ${aba === "aprovada" ? "is-active" : ""}`} onClick={() => setAba("aprovada")}>
                    Em processo ({emProcesso.length})
                </button>
                <button type="button" className={`sugestao-tabs__tab ${aba === "encerradas" ? "is-active" : ""}`} onClick={() => setAba("encerradas")}>
                    Encerradas ({encerradas.length})
                </button>
            </div>

            <div className="sugestao-filtro mb-3 mx-2">
                <span className="sugestao-filtro__label">Filtrar por tipo:</span>
                <button
                    type="button"
                    className={`sugestao-filtro__chip ${filtroTipo === "todos" ? "is-active" : ""}`}
                    onClick={() => setFiltroTipo("todos")}
                >
                    Todos
                </button>
                <button
                    type="button"
                    className={`sugestao-filtro__chip ${filtroTipo === "nova" ? "is-active" : ""}`}
                    onClick={() => setFiltroTipo("nova")}
                >
                    🌱 Nova planta
                </button>
                <button
                    type="button"
                    className={`sugestao-filtro__chip ${filtroTipo === "correcao" ? "is-active" : ""}`}
                    onClick={() => setFiltroTipo("correcao")}
                >
                    ✏️ Correção
                </button>
            </div>

            {aviso && <div className="alert alert-success mx-2">{aviso}</div>}

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando sugestões...
                </div>
            ) : error ? (
                <div className="alert alert-danger mx-2">{error}</div>
            ) : listaAtual.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="fas fa-inbox fa-2x mb-3 d-block" style={{ opacity: 0.3 }}></i>
                    Nenhuma sugestão nesta seção.
                </div>
            ) : (
                <div className="admin-messages-list mx-2">
                    {listaAtual.map(sug => (
                        <SugestaoCard
                            key={String(sug._id)}
                            sug={sug}
                            acoes={{
                                executar,
                                onPrevia: setPreviaSug,
                                onEditar: (sug) => navigate(`/createplant?sugestao=${sug._id}`),
                            }}
                        />
                    ))}
                </div>
            )}

            <PreviaFicha
                aberto={Boolean(previaSug)}
                sug={previaSug}
                onFechar={() => setPreviaSug(null)}
            />
        </div>
    )
}