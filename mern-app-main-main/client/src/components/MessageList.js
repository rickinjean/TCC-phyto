import { useState } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import useAuthFetchData from "../useAuthFetchData"

const ASSUNTOS = {
    duvida: "Dúvida",
    sugestao: "Sugestão",
    colaboracao: "Colaboração",
    bug: "Bug",
    outro: "Outro",
}

const ASSUNTO_ICONS = {
    duvida: "fas fa-question-circle",
    sugestao: "fas fa-lightbulb",
    colaboracao: "fas fa-handshake",
    bug: "fas fa-bug",
    outro: "fas fa-envelope",
}

function MessageCard({ msg, onDelete }) {
    const [expanded, setExpanded] = useState(false)
    const data = new Date(msg.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    })

    const iconClass = ASSUNTO_ICONS[msg.assunto] || ASSUNTO_ICONS.outro
    const isLong = msg.mensagem.length > 180

    return (
        <div className="admin-message-card">
            <div className="admin-message-card__header">
                <div className="admin-message-card__header-top">
                    <div className="admin-message-card__meta">
                        <i className={`${iconClass} admin-message-card__icon`} aria-hidden="true" />
                        <span className="admin-message-card__name">{msg.nome}</span>
                        <span className="admin-message-card__badge">{ASSUNTOS[msg.assunto] || msg.assunto}</span>
                    </div>
                    <button
                        className="admin-message-card__delete"
                        title="Excluir mensagem"
                        onClick={(e) => { e.stopPropagation(); onDelete(msg._id) }}
                        aria-label="Excluir mensagem"
                    >
                        <i className="fas fa-trash-alt" />
                    </button>
                </div>
                <div className="admin-message-card__header-bottom">
                    <span className="admin-message-card__email">{msg.email}</span>
                    <span className="admin-message-card__date">{data}</span>
                </div>
            </div>

            <div className="admin-message-card__body">
                <p className={`admin-message-card__text ${!expanded && isLong ? "admin-message-card__text--truncated" : ""}`}>
                    {msg.mensagem}
                </p>
                {isLong && (
                    <button
                        className="admin-message-card__toggle"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? "Ver menos" : "Ver mensagem completa"}
                        <i className={`fas fa-chevron-${expanded ? "up" : "down"} ms-1`} />
                    </button>
                )}
            </div>
        </div>
    )
}

export default function MessageList() {
    usePageTitle("Mensagens")
    const { data: messages = [], setData: setMessages, loading, error, setError } = useAuthFetchData(`${API_URL}/api/messages`, [], "Erro ao carregar mensagens")

    async function deleteMessage(id) {
        if (!window.confirm("Deseja excluir esta mensagem?")) return
        try {
            const res = await authFetch(`${API_URL}/api/messages/${id}`, { method: "DELETE" })
            if (res === null) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                setError("Erro ao excluir mensagem.")
                return
            }
            setMessages(prev => prev.filter(m => m._id !== id))
        } catch {
            setError("Erro ao conectar com o servidor")
        }
    }

    return (
        <div className="admin-page admin-page--messages">
            <h3 className="admin-page__title ps-2">Mensagens Recebidas</h3>
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando mensagens...
                </div>
            ) : error ? (
                <div className="alert alert-danger mx-2">{error}</div>
            ) : messages.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="fas fa-inbox fa-2x mb-3 d-block" style={{opacity: 0.3}}></i>
                    Nenhuma mensagem recebida.
                </div>
            ) : (
                <div className="admin-messages-list mx-2">
                    {messages.map(msg => (
                        <MessageCard key={msg._id} msg={msg} onDelete={deleteMessage} />
                    ))}
                </div>
            )}
        </div>
    )
}