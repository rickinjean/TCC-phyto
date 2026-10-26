import { useCallback, useEffect, useState } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"

export default function GlossarioAdmin() {
    const [termos, setTermos] = useState([])
    const [termo, setTermo] = useState("")
    const [definicao, setDefinicao] = useState("")
    const [editando, setEditando] = useState(null)
    const [erro, setErro] = useState("")
    const [carregando, setCarregando] = useState(true)

    const carregar = useCallback(async () => {
        setCarregando(true)
        const res = await authFetch(`${API_URL}/api/glossario/admin`)
        if (res?.ok) setTermos(await res.json())
        else setErro("Não foi possível carregar o glossário.")
        setCarregando(false)
    }, [])

    useEffect(() => { carregar() }, [carregar])

    async function salvar(event) {
        event.preventDefault()
        setErro("")
        const url = `${API_URL}/api/glossario${editando ? `/${editando}` : ""}`
        const res = await authFetch(url, { method: editando ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ termo, definicao }) })
        if (!res?.ok) {
            const body = await res?.json().catch(() => ({}))
            setErro(body.mensagem || "Não foi possível salvar o termo.")
            return
        }
        setTermo(""); setDefinicao(""); setEditando(null)
        await carregar()
    }

    function editar(item) { setEditando(item.id); setTermo(item.termo); setDefinicao(item.definicao); window.scrollTo({ top: 0, behavior: "smooth" }) }

    async function excluir(item) {
        if (!window.confirm(`Excluir “${item.termo}” do glossário?`)) return
        const res = await authFetch(`${API_URL}/api/glossario/${item.id}`, { method: "DELETE" })
        if (!res?.ok) { setErro("Não foi possível excluir o termo."); return }
        await carregar()
    }

    return <section className="container py-4 glossario-admin">
        <header className="mb-4"><h1>Glossário botânico</h1><p className="text-muted">Cadastre definições simples para os termos técnicos das fichas.</p></header>
        <form className="card p-3 p-md-4 mb-4" onSubmit={salvar}>
            <h2 className="h5">{editando ? "Editar termo" : "Adicionar termo"}</h2>
            <label className="form-label" htmlFor="glossario-termo">Termo</label>
            <input id="glossario-termo" className="form-control mb-3" value={termo} onChange={(e) => setTermo(e.target.value)} maxLength={100} required />
            <label className="form-label" htmlFor="glossario-definicao">Definição simples</label>
            <textarea id="glossario-definicao" className="form-control mb-3" value={definicao} onChange={(e) => setDefinicao(e.target.value)} maxLength={500} rows={3} required />
            {erro && <p className="alert alert-danger" role="alert">{erro}</p>}
            <div className="d-flex gap-2"><button className="btn btn-success" type="submit">{editando ? "Salvar alterações" : "Cadastrar termo"}</button>{editando && <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditando(null); setTermo(""); setDefinicao("") }}>Cancelar</button>}</div>
        </form>
        <h2 className="h4">Termos cadastrados <span className="badge text-bg-secondary">{termos.length}</span></h2>
        {carregando ? <p role="status">Carregando termos…</p> : termos.length ? <div className="table-responsive"><table className="table table-striped align-middle"><thead><tr><th scope="col">Termo</th><th scope="col">Definição</th><th scope="col">Ações</th></tr></thead><tbody>{termos.map((item) => <tr key={item.id}><th scope="row">{item.termo}</th><td>{item.definicao}</td><td><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => editar(item)}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => excluir(item)}>Excluir</button></div></td></tr>)}</tbody></table></div> : <p className="text-muted">Ainda não há termos cadastrados.</p>}
    </section>
}
