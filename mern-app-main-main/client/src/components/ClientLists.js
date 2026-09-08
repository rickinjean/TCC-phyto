import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import { COR_PADRAO } from "../listaCores"
import PaletaCores from "./PaletaCores"

function ListaCard({ lista, onRename, onDelete }) {
    const [editing, setEditing] = useState(false)
    const [nome, setNome] = useState(lista.name)
    const [cor, setCor] = useState(lista.color || COR_PADRAO)
    const [saving, setSaving] = useState(false)

    async function salvar() {
        const trimmed = nome.trim()
        if (!trimmed || trimmed === lista.name) {
            setNome(lista.name)
            setEditing(false)
            return
        }
        setSaving(true)
        const ok = await onRename(lista._id, trimmed, cor)
        setSaving(false)
        if (ok) setEditing(false)
    }

    return (
        <div className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="userlist-card card h-100 border-0">
                <Link
                    className="userlist-card__main"
                    to={`/minhas-listas/${lista._id}`}
                    aria-label={`Abrir lista ${lista.name}`}
                >
                    <span
                        className="userlist-card__dot"
                        style={{ backgroundColor: lista.color || COR_PADRAO }}
                        aria-hidden="true"
                    />
                    <span className="userlist-card__meta">
                        <span className="userlist-card__name">{lista.name}</span>
                        <span className="userlist-card__count">
                            {lista.count} {lista.count === 1 ? "planta" : "plantas"}
                        </span>
                    </span>
                </Link>

                <div className="userlist-card__actions">
                    {editing ? (
                        <div className="userlist-card__form">
                            <input
                                className="form-control form-control-sm"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                maxLength={80}
                                aria-label="Novo nome da lista"
                            />
                            <PaletaCores valor={cor} onChange={setCor} />
                            <button type="button" className="btn btn-sm btn-success" onClick={salvar} disabled={saving}>
                                Salvar
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => { setNome(lista.name); setCor(lista.color || COR_PADRAO); setEditing(false) }}
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setEditing(true)}
                            >
                                Renomear / Cor
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => onDelete(lista._id, lista.name)}
                            >
                                Excluir
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ClientLists() {
    usePageTitle("Minhas Listas")
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [novaLista, setNovaLista] = useState("")
    const [novaCor, setNovaCor] = useState(COR_PADRAO)
    const [criando, setCriando] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch(`${API_URL}/userlists`)
                if (!res) {
                    setError("Sessão expirada. Faça login novamente.")
                    return
                }
                if (!res.ok) {
                    setError(`Erro ao carregar listas: ${res.status}`)
                    return
                }
                setLists(await res.json())
            } catch {
                setError("Erro ao conectar com o servidor")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function criar(e) {
        e.preventDefault()
        const name = novaLista.trim()
        if (!name || criando) return
        setCriando(true)
        try {
            const res = await authFetch(`${API_URL}/userlists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color: novaCor })
            })
            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setError(data.message || "Erro ao criar a lista.")
                return
            }
            const data = await res.json()
            setLists(prev => [{ _id: data._id, name, color: data.color || novaCor, count: 0 }, ...prev])
            setNovaLista("")
            setNovaCor(COR_PADRAO)
        } catch {
            setError("Erro ao conectar com o servidor")
        } finally {
            setCriando(false)
        }
    }

    async function renomear(id, name, cor) {
        try {
            const res = await authFetch(`${API_URL}/userlists/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color: cor })
            })
            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return false
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setError(data.message || "Erro ao renomear a lista.")
                return false
            }
            setLists(prev => prev.map(l => l._id === id ? { ...l, name, color: cor } : l))
            return true
        } catch {
            setError("Erro ao conectar com o servidor")
            return false
        }
    }

    async function excluir(id, name) {
        if (!window.confirm(`Excluir a lista "${name}"? As plantas da lista são mantidas no catálogo.`)) return
        try {
            const res = await authFetch(`${API_URL}/userlists/${id}`, { method: "DELETE" })
            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                setError("Erro ao excluir a lista.")
                return
            }
            setLists(prev => prev.filter(l => l._id !== id))
        } catch {
            setError("Erro ao conectar com o servidor")
        }
    }

    return (
        <div className="userlists-page container mt-4">
            <h3 className="page-title-ambar fw-semibold mb-1">
                Minhas Listas
            </h3>
            <p className="plant-list-page__count mb-4">
                Organize as plantas em coleções, como "Jardim", "TCC" ou "Para estudar".
            </p>

            <form className="userlists-newform mb-4" onSubmit={criar}>
                <div className="userlists-newform__row">
                    <label className="visually-hidden" htmlFor="nova-lista">Nome da nova lista</label>
                    <input
                        id="nova-lista"
                        className="form-control"
                        placeholder="Nome da nova lista (ex.: Jardim, TCC)"
                        value={novaLista}
                        maxLength={80}
                        onChange={(e) => setNovaLista(e.target.value)}
                    />
                    <button type="submit" className="btn btn-success" disabled={criando || !novaLista.trim()}>
                        Criar lista
                    </button>
                </div>
                <div className="userlists-newform__cor">
                    <PaletaCores valor={novaCor} onChange={setNovaCor} />
                </div>
            </form>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando listas...
                </div>
            ) : error ? (
                <div className="alert alert-danger mx-2">{error}</div>
            ) : lists.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <div className="favorites-page-empty__icon">📚</div>
                    <p>Você ainda não criou nenhuma lista.</p>
                    <Link to="/plantlist" className="favorites-page-empty__link">
                        Explorar o catálogo
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {lists.map(lista => (
                        <ListaCard
                            key={String(lista._id)}
                            lista={lista}
                            onRename={renomear}
                            onDelete={excluir}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}