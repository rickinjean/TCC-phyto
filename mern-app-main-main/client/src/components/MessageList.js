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

function MessageCard({ msg, onDelete }) {
    const [expanded, setExpanded] = useState(false)
    const data = new Date(msg.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    })

    return (
        <div className="admin-message-card">
            <div className="admin-message-card__header" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}>
                <div className="admin-message-card__meta">
                    <span className="admin-message-card__name">{msg.nome}</span>
                    <span className="admin-message-card__badge">{ASSUNTOS[msg.assunto] || msg.assunto}</span>
                </div>
                <div className="admin-message-card__meta">
                    <span className="admin-message-card__date">{data}</span>
                    <span className={`admin-message-card__chevron ${expanded ? "is-open" : ""}`} aria-hidden="true">›</span>
                </div>
            </div>
            {expanded && (
                <div className="admin-message-card__body">
                    <div className="admin-message-card__fields">
                        <div><strong>Email:</strong> {msg.email}</div>
                        <div><strong>Assunto:</strong> {ASSUNTOS[msg.assunto] || msg.assunto}</div>
                    </div>
                    <p className="admin-message-card__text">{msg.mensagem}</p>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(msg._id)}>
                        Excluir
                    </button>
                </div>
            )}
        </div>
    )
}

export default function MessageList() {
    usePageTitle("Mensagens")
    const { data: messages = [], setData: setMessages, loading, error, setError } = useAuthFetchData(`${API_URL}/messages`, [], "Erro ao carregar mensagens")

    async function deleteMessage(id) {
        if (!window.confirm("Deseja excluir esta mensagem?")) return
        try {
            const res = await authFetch(`${API_URL}/messages/${id}`, { method: "DELETE" })
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