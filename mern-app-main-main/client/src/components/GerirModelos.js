import { useState } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import useAuthFetchData from "../useAuthFetchData"

// Gestão de modelos de IA (somente ADM): lista, exclui e importa modelos
// exportados do Teachable Machine (model.json + .bin + metadata.json).
export default function GerirModelos() {
    usePageTitle("Gerir Modelos de IA", "Importe e gerencie modelos de identificação de plantas.", "/gerir-modelos")

    const { data: modelos = [], loading, error, recarregar } = useAuthFetchData(
        `${API_URL}/ai/models`, [], "Erro ao carregar modelos"
    )

    const [nome, setNome] = useState("")
    const [descricao, setDescricao] = useState("")
    const [modelFile, setModelFile] = useState(null)
    const [weightsFile, setWeightsFile] = useState(null)
    const [metadataFile, setMetadataFile] = useState(null)
    const [enviando, setEnviando] = useState(false)
    const [msg, setMsg] = useState("")
    const [erro, setErro] = useState("")

    async function handleUpload(e) {
        e.preventDefault()
        if (!modelFile || !weightsFile || !metadataFile) {
            setErro("Selecione os 3 arquivos: model.json, weights (.bin) e metadata.json.")
            return
        }
        setEnviando(true)
        setMsg("")
        setErro("")
        try {
            const form = new FormData()
            form.append("model", modelFile)
            form.append("weights", weightsFile)
            form.append("metadata", metadataFile)
            form.append("nome", nome)
            form.append("descricao", descricao)
            const res = await authFetch(`${API_URL}/ai/models/tm`, { method: "POST", body: form })
            if (!res) {
                setErro("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                const corpo = await res.json().catch(function () { return {} })
                setErro(corpo.message || "Falha ao importar o modelo.")
                return
            }
            setMsg("Modelo importado com sucesso!")
            setNome(""); setDescricao("")
            setModelFile(null); setWeightsFile(null); setMetadataFile(null)
            recarregar()
        } finally {
            setEnviando(false)
        }
    }

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
                    Você também pode importar um modelo treinado no Teachable Machine.
                </p>
            </div>

            <div className="gerir__importar card p-3 mb-4">
                <h3 className="h5 mb-2">Importar modelo do Teachable Machine</h3>
                <p className="small text-muted">
                    Exporte no Teachable Machine como <strong>TensorFlow.js → "Download my model"</strong>
                    e selecione os arquivos <code>model.json</code>, <code>group1-shard*.bin</code> e <code>metadata.json</code>.
                </p>
                <form onSubmit={handleUpload} className="row g-2">
                    <div className="col-md-4">
                        <label className="form-label small mb-1">Nome (opcional)</label>
                        <input type="text" className="form-control" value={nome} onChange={function (e) { setNome(e.target.value) }} placeholder="ex.: Modelo Plantas Sombrio" />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small mb-1">model.json</label>
                        <input type="file" accept="application/json,.json" className="form-control" onChange={function (e) { setModelFile(e.target.files && e.target.files[0]) }} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small mb-1">weights (.bin)</label>
                        <input type="file" accept=".bin,application/octet-stream" className="form-control" onChange={function (e) { setWeightsFile(e.target.files && e.target.files[0]) }} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small mb-1">metadata.json</label>
                        <input type="file" accept="application/json,.json" className="form-control" onChange={function (e) { setMetadataFile(e.target.files && e.target.files[0]) }} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small mb-1">Descrição (opcional)</label>
                        <input type="text" className="form-control" value={descricao} onChange={function (e) { setDescricao(e.target.value) }} placeholder="Descreva o modelo" />
                    </div>
                    <div className="col-12">
                        <button type="submit" className="btn btn-primary" disabled={enviando}>
                            {enviando ? "Enviando…" : "⬆ Importar modelo"}
                        </button>
                    </div>
                </form>
                {msg && <p className="text-success mt-2 mb-0 small">✓ {msg}</p>}
                {erro && <p className="text-danger mt-2 mb-0 small">✗ {erro}</p>}
            </div>

            <div className="gerir__lista">
                <h3 className="h5 mb-2">Modelos disponíveis</h3>
                {loading && <div className="d-flex align-items-center gap-2"><div className="spinner-border spinner-border-sm text-primary" role="status" /> Carregando…</div>}
                {error && !loading && <p className="text-danger small">{error}</p>}
                {!loading && !error && modelos.length === 0 && (
                    <p className="text-muted">Nenhum modelo cadastrado.</p>
                )}
                {modelos.map(function (m) {
                    const tipo = m.tipo === "tm" ? "TM importado" : "Treinado no app"
                    return (
                        <div className="gerir__item card p-3 mb-2" key={m._id}>
                            <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                    <strong>{m.nome}</strong>
                                    <div className="small text-muted">
                                        {tipo} · {m.totalClasses} classe(s)
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