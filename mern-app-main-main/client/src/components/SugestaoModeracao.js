import { useState, useEffect } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"

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

function SugestaoCard({ sug, executar }) {
    const [working, setWorking] = useState(false)

    const ehNova = sug.tipo === "nova"
    const d = sug.data || {}
    const status = sug.status

    async function handleExecutar(acao) {
        setWorking(true)
        await executar(sug, acao)
        setWorking(false)
    }

    return (
        <div className="admin-message-card">
            <div className="admin-message-card__header">
                <div className="admin-message-card__meta">
                    <span className="admin-message-card__name">
                        {ehNova ? d.name || "Sem nome" : sug.plantaNome || "Correção"}
                    </span>
                    <span className={`sugestao-badge sugestao-badge--${status}`}>
                        {TIPO_LABEL[sug.tipo]} · {STATUS_LABEL[status]}
                    </span>
                </div>
                <span className="admin-message-card__date">{formatarData(sug.created)}</span>
            </div>

            <div className="admin-message-card__body">
                {ehNova ? (
                    <div className="sugestao-card__detalhes">
                        {d.scientificName && <div><strong>Nome científico:</strong> {d.scientificName}</div>}
                        {d.simpleDescription && <div><strong>Descrição:</strong> {d.simpleDescription}</div>}
                        {[d.Genero, d.Especie, d.Family].filter(Boolean).length > 0 && (
                            <div><strong>Taxonomia:</strong> {[d.Genero, d.Especie, d.Family].filter(Boolean).join(" · ")}</div>
                        )}
                    </div>
                ) : (
                    <div className="sugestao-card__detalhes">
                        {sug.campo && <div><strong>Campo:</strong> {sug.campo}</div>}
                        {sug.texto && <div><strong>Texto:</strong> {sug.texto}</div>}
                    </div>
                )}

                <div className="sugestao-card__info">
                    <span>Enviado por: {sug.userName || "—"}</span>
                </div>

                <div className="sugestao-card__acoes">
                    {status === "pendente" && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-success"
                                disabled={working}
                                onClick={() => handleExecutar("aprovar")}
                            >
                                Aprovar → Em processo
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={working}
                                onClick={() => handleExecutar("rejeitar")}
                            >
                                Rejeitar
                            </button>
                        </>
                    )}
                    {status === "aprovada" && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={working}
                                onClick={() => handleExecutar("voltar")}
                            >
                                Voltar para pendente
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={working}
                                onClick={() => handleExecutar("rejeitar")}
                            >
                                Rejeitar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function SugestaoModeracao() {
    usePageTitle("Moderar Sugestões")
    const [todas, setTodas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [aba, setAba] = useState("pendente")
    const [filtroTipo, setFiltroTipo] = useState("todos")
    const [aviso, setAviso] = useState("")

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

    async function executar(sug, acao) {
        setAviso("")
        try {
            const status = acao === "aprovar" ? "aprovada"
                : acao === "rejeitar" ? "rejeitada"
                    : "pendente"

            const res = await authFetch(`${API_URL}/suggestions/${sug._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            })

            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setError(data.message || "Erro ao atualizar a sugestão.")
                return
            }

            setTodas(prev => prev.map(s =>
                s._id === sug._id ? { ...s, status } : s
            ))
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
                            executar={executar}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}