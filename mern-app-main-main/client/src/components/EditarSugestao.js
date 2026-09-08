import { useEffect, useState } from "react"
import API_URL from "../config"

const NOVA_BASE = {
    name: "", scientificName: "", simpleDescription: "", description: "",
    origin: "", type: "", Family: "", Genero: "", Especie: "",
}

function Edicao(id, label, value, onChange, { textarea = false, placeholder = "", maxLength, obrigatorio = false } = {}) {
    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label fw-semibold">
                {label}
                {obrigatorio && <span className="sugestao-required" title="Obrigatório"> *</span>}
            </label>
            {textarea ? (
                <textarea id={id} className="form-control" rows="4" value={value || ""} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <input id={id} type="text" className="form-control" value={value || ""} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
            )}
        </div>
    )
}

export default function EditarSugestao({ aberto, onFechar, sug, onSalvar }) {
    const [dados, setDados] = useState({ ...NOVA_BASE })
    const [tipos, setTipos] = useState([])
    const [origens, setOrigens] = useState([])
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState("")

    useEffect(() => {
        if (aberto) {
            setDados({ ...NOVA_BASE, ...((sug && sug.data) || {}) })
            setErro("")
        }
    }, [aberto, sug])

    useEffect(() => {
        if (!aberto) return
        let cancelled = false
        async function load() {
            try {
                const [tRes, oRes] = await Promise.all([
                    fetch(`${API_URL}/collections/type`),
                    fetch(`${API_URL}/collections/origin`),
                ])
                if (!cancelled) {
                    if (tRes.ok) {
                        const data = await tRes.json()
                        setTipos(Array.isArray(data) ? data.filter(x => x && x.name) : [])
                    }
                    if (oRes.ok) {
                        const data = await oRes.json()
                        setOrigens(Array.isArray(data) ? data.filter(x => x && x.name) : [])
                    }
                }
            } catch { /* coleções indisponíveis: selects ficam vazios */ }
        }
        load()
        return () => { cancelled = true }
    }, [aberto])

    if (!aberto) return null

    function setCampo(campo, valor) {
        setDados(prev => ({ ...prev, [campo]: valor }))
    }

    async function salvar(e) {
        e.preventDefault()
        if (!dados.name || !dados.name.trim()) return
        setSalvando(true)
        setErro("")
        const ok = await onSalvar(dados)
        setSalvando(false)
        if (ok) onFechar()
    }

    return (
        <div className="preview-modal__overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
            <div className="edit-modal" role="dialog" aria-modal="true" aria-label="Editar dados da sugestão">
                <div className="preview-modal__header">
                    <h4 className="preview-modal__title">✏️ Editar dados da sugestão</h4>
                    <button type="button" className="preview-modal__close" onClick={onFechar} aria-label="Fechar">×</button>
                </div>

                <form className="preview-modal__body edit-modal__form" onSubmit={salvar}>
                    {erro && <div className="alert alert-danger">{erro}</div>}

                    {Edicao("edit-name", "Nome popular", dados.name, v => setCampo("name", v), { maxLength: 200, placeholder: "Ex.: Hortelã", obrigatorio: true })}
                    {Edicao("edit-sci", "Nome científico", dados.scientificName, v => setCampo("scientificName", v), { maxLength: 200, placeholder: "Ex.: Mentha spicata" })}
                    {Edicao("edit-simples", "Descrição curta (aparece no catálogo)", dados.simpleDescription, v => setCampo("simpleDescription", v), { maxLength: 200, placeholder: "Ex.: Erva aromática de hortas e quintais." })}

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="edit-tipo" className="form-label fw-semibold">Tipo de planta</label>
                            <select
                                id="edit-tipo"
                                className="form-select"
                                value={dados.type || ""}
                                disabled={tipos.length === 0}
                                onChange={e => setCampo("type", e.target.value)}
                            >
                                <option value="">Selecione o tipo…</option>
                                {tipos.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="edit-origem" className="form-label fw-semibold">Origem</label>
                            <select
                                id="edit-origem"
                                className="form-select"
                                value={dados.origin || ""}
                                disabled={origens.length === 0}
                                onChange={e => setCampo("origin", e.target.value)}
                            >
                                <option value="">Selecione a origem…</option>
                                {origens.map(o => <option key={o._id} value={o.name}>{o.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4">{Edicao("edit-genero", "Gênero", dados.Genero, v => setCampo("Genero", v), { maxLength: 120, placeholder: "Ex.: Mentha" })}</div>
                        <div className="col-md-4">{Edicao("edit-especie", "Espécie", dados.Especie, v => setCampo("Especie", v), { maxLength: 120, placeholder: "Ex.: spicata" })}</div>
                        <div className="col-md-4">{Edicao("edit-familia", "Família", dados.Family, v => setCampo("Family", v), { maxLength: 120, placeholder: "Ex.: Lamiaceae" })}</div>
                    </div>

                    {Edicao("edit-desc", "Descrição completa", dados.description, v => setCampo("description", v), { textarea: true, maxLength: 2000, placeholder: "Descreva a planta com o máximo de detalhes que souber." })}

                    <div className="preview-modal__footer">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onFechar}>Cancelar</button>
                        <button
                            type="submit"
                            className="btn btn-sm btn-success"
                            disabled={salvando || !dados.name || !dados.name.trim()}
                        >
                            {salvando ? "Salvando..." : "Salvar dados"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}