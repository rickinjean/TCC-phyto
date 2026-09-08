import { useState, useEffect, useRef } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import { COR_PADRAO } from "../listaCores"
import PaletaCores from "./PaletaCores"

export default function ListaPicker({ aberto, plantaId, plantaNome, onFechar }) {
    const [listas, setListas] = useState([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState(null)
    const [aviso, setAviso] = useState(null)
    const [salvando, setSalvando] = useState(false)
    const [novoNome, setNovoNome] = useState("")
    const [novaCor, setNovaCor] = useState(COR_PADRAO)
    const dialogRef = useRef(null)
    const corpoRef = useRef(null)

    useEffect(() => {
        if (!aberto) return
        const anterior = document.activeElement
        const dialog = dialogRef.current
        if (dialog) dialog.focus()

        function onKey(e) {
            if (e.key === "Escape") onFechar()
        }
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("keydown", onKey)
            if (anterior && typeof anterior.focus === "function") anterior.focus()
        }
    }, [aberto, onFechar])

    useEffect(() => {
        if (!aberto || !plantaId) return
        let cancelled = false
        setAviso(null)
        async function carregar() {
            setLoading(true)
            try {
                const res = await authFetch(`${API_URL}/userlists?plantId=${plantaId}`)
                if (!res) {
                    if (!cancelled) setErro("Sessão expirada. Faça login novamente.")
                } else if (res.ok) {
                    if (!cancelled) setListas(await res.json())
                } else if (!cancelled) {
                    setErro(`Erro ao carregar coleções: ${res.status}`)
                }
            } catch {
                if (!cancelled) setErro("Erro ao conectar com o servidor")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        carregar()
        return () => { cancelled = true }
    }, [aberto, plantaId])

    if (!aberto) return null

    async function alternar(lista) {
        setAviso(null)
        let res
        try {
            if (lista.contains) {
                res = await authFetch(`${API_URL}/userlists/${lista._id}/plants/${plantaId}`, { method: "DELETE" })
            } else {
                res = await authFetch(`${API_URL}/userlists/${lista._id}/plants`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plantId: plantaId })
                })
            }
        } catch (err) {
            setAviso("Não foi possível atualizar a coleção.")
            return
        }
        if (!res) {
            setAviso("Sessão expirada. Entre novamente para atualizar suas coleções.")
            return
        }
        if (!res.ok) {
            setAviso("Não foi possível atualizar a coleção.")
            return
        }
        setListas(prev => prev.map(l => l._id === lista._id
            ? { ...l, contains: !lista.contains, count: Math.max(0, l.count + (lista.contains ? -1 : 1)) }
            : l))
    }

    async function criar(e) {
        e.preventDefault()
        const nome = novoNome.trim()
        if (!nome || salvando) return
        setSalvando(true)
        setAviso(null)
        try {
            const res = await authFetch(`${API_URL}/userlists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nome, color: novaCor })
            })
            if (!res) {
                setAviso("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setAviso(data.message || "Erro ao criar a coleção.")
                return
            }
            const data = await res.json()
            const res2 = await authFetch(`${API_URL}/userlists/${data._id}/plants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plantId: plantaId })
            })
            const adicionada = res2 && res2.ok
            setListas(prev => [{
                _id: data._id,
                name: nome,
                color: data.color || novaCor,
                count: adicionada ? 1 : 0,
                contains: adicionada
            }, ...prev])
            setNovoNome("")
            setNovaCor(COR_PADRAO)
        } catch {
            setAviso("Erro ao conectar com o servidor")
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div className="lista-picker__overlay" onClick={onFechar}>
            <div
                className="lista-picker__modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Escolher coleção para ${plantaNome}`}
                tabIndex="-1"
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="lista-picker__header">
                    <div>
                        <h2 className="lista-picker__title">Salvar em coleção</h2>
                        <p className="lista-picker__subtitle">{plantaNome}</p>
                    </div>
                    <button
                        type="button"
                        className="lista-picker__close"
                        onClick={onFechar}
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                <div className="lista-picker__body" ref={corpoRef}>
                    {loading ? (
                        <p className="lista-picker__empty">Carregando suas coleções...</p>
                    ) : erro ? (
                        <p className="lista-picker__empty" role="alert">{erro}</p>
                    ) : listas.length === 0 ? (
                        <p className="lista-picker__empty">Você ainda não tem coleções. Crie uma abaixo.</p>
                    ) : (
                        <ul className="lista-picker__list">
                            {listas.map(lista => {
                                const selected = Boolean(lista.contains)
                                return (
                                    <li key={String(lista._id)}>
                                        <button
                                            type="button"
                                            className={`lista-picker__item ${selected ? "is-selected" : ""}`}
                                            onClick={() => alternar(lista)}
                                            aria-pressed={selected}
                                        >
                                            <span className="lista-picker__dot" style={{ backgroundColor: lista.color || COR_PADRAO }} aria-hidden="true" />
                                            <span className="lista-picker__nome">{lista.name}</span>
                                            <span className="lista-picker__qtd">{lista.count}</span>
                                            <span className={`lista-picker__check ${selected ? "is-visible" : ""}`} aria-hidden="true">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <div className="lista-picker__footer">
                    <form className="lista-picker__new" onSubmit={criar}>
                        <label className="visually-hidden" htmlFor="lista-picker-novo">Nome da nova coleção</label>
                        <input
                            id="lista-picker-novo"
                            className="form-control"
                            placeholder="Nova coleção (ex.: Jardim, TCC)"
                            value={novoNome}
                            maxLength={80}
                            onChange={(e) => setNovoNome(e.target.value)}
                        />
                        <div className="lista-picker__paleta">
                            <PaletaCores valor={novaCor} onChange={setNovaCor} />
                        </div>
                        <button type="submit" className="btn btn-success" disabled={salvando || !novoNome.trim()}>
                            {salvando ? "Criando..." : "Criar e adicionar"}
                        </button>
                    </form>
                    {aviso && <p className="lista-picker__aviso mt-2" role="status">{aviso}</p>}
                </div>
            </div>
        </div>
    )
}