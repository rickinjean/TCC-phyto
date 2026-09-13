import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import useAuthFetchData from "../useAuthFetchData"

// Gestão de modelos de IA (somente ADM): lista e exclui modelos
// KNN treinados no aplicativo.
export default function GerirModelos() {
    usePageTitle("Gerir Modelos de IA", "Gerencie os modelos de identificação de plantas.", "/gerir-modelos")

    const { data: modelos = [], loading, error, recarregar } = useAuthFetchData(
        `${API_URL}/ai/models`, [], "Erro ao carregar modelos"
    )

    async function handleDelete(modelo) {
        if (!window.confirm("Excluir o modelo \"" + modelo.nome + "\"?")) return
        try {
            const res = await authFetch(`${API_URL}/ai/models/${modelo._id}`, { method: "DELETE" })
            if (!res) return
            if (res.ok) {
                recarregar()
            } else {
                alert("Falha ao excluir modelo.")
            }
        } catch (err) {
            alert("Erro de conexão ao excluir modelo.")
        }
    }

    return (
        <div className="gerir container py-4">
            <div className="gerir__cabecalho">
                <h1 className="gerir__titulo">🤖 Gerir Modelos de IA</h1>
                <p className="gerir__subtitulo">
                    Modelos salvos ficam disponíveis para todos os usuários no Identificador.
                </p>
            </div>

            <div className="gerir__lista">
                <h3 className="h5 mb-2">Modelos disponíveis</h3>
                {loading && <div className="d-flex align-items-center gap-2"><div className="spinner-border spinner-border-sm text-primary" role="status" /> Carregando…</div>}
                {error && !loading && <p className="text-danger small">{error}</p>}
                {!loading && !error && modelos.length === 0 && (
                    <p className="text-muted">Nenhum modelo cadastrado.</p>
                )}
                {modelos.map(function (m) {
                    return (
                        <div className="gerir__item card p-3 mb-2" key={m._id}>
                            <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                    <strong>{m.nome}</strong>
                                    <div className="small text-muted">
                                        Treinado no app · {m.totalClasses} classe(s)
                                        {m.labels && m.labels.length > 0 && " · " + m.labels.join(", ")}
                                    </div>
                                    {m.descricao && <div className="small mt-1">{m.descricao}</div>}
                                    <div className="small text-muted mt-1">
                                        Criado em {new Date(m.criadoEm).toLocaleString("pt-BR")}
                                        {m.criadoPor && m.criadoPor.nome ? " por " + m.criadoPor.nome : ""}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={function () { handleDelete(m) }}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}