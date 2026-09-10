import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import useAuthFetchData from "../useAuthFetchData"
import { NOVA_INICIAL, FormNovaPlanta, FormCorrecao, MinhasSugestoes } from "./SugestaoForms"

export default function Sugestao() {
    usePageTitle("Sugerir Planta / Reportar Erro")
    const [aba, setAba] = useState("nova")

    const [nova, setNova] = useState({ ...NOVA_INICIAL })
    const [tipos, setTipos] = useState([])
    const [origens, setOrigens] = useState([])
    const [plantas, setPlantas] = useState([])
    const [plantaId, setPlantaId] = useState("")
    const [plantaNome, setPlantaNome] = useState("")
    const [campo, setCampo] = useState("")
    const [texto, setTexto] = useState("")

    const [enviando, setEnviando] = useState(false)
    const [ok, setOk] = useState(false)
    const [erro, setErro] = useState("")

    const { data: minhas = [], loading: carregandoMinhas, error: erroMinhas, recarregar } = useAuthFetchData(
        `${API_URL}/suggestions/minhas`, [aba], "Erro ao carregar suas sugestões", aba === "minhas"
    )

    useEffect(() => {
        async function loadOpcoes() {
            try {
                const [plantRes, typeRes, originRes] = await Promise.all([
                    fetch(`${API_URL}/plant`),
                    fetch(`${API_URL}/collections/type`),
                    fetch(`${API_URL}/collections/origin`)
                ])
                if (plantRes.ok) {
                    const data = await plantRes.json()
                    setPlantas(data.map(p => ({
                        _id: p._id,
                        name: p.scientificName ? `${p.name} — ${p.scientificName}` : p.name
                    })))
                }
                if (typeRes.ok) {
                    const data = await typeRes.json()
                    setTipos(Array.isArray(data) ? data.filter(t => t && t.name) : [])
                }
                if (originRes.ok) {
                    const data = await originRes.json()
                    setOrigens(Array.isArray(data) ? data.filter(o => o && o.name) : [])
                }
            } catch { /* lista de plantas/opções indisponível adia a escolha */ }
        }
        loadOpcoes()
    }, [])

    function setCampoNova(campo, valor) {
        setNova(prev => ({ ...prev, [campo]: valor }))
    }

    function limparTudo() {
        setNova({ ...NOVA_INICIAL })
        setPlantaId("")
        setPlantaNome("")
        setCampo("")
        setTexto("")
        setOk(false)
        setErro("")
    }

    async function enviar(e) {
        e.preventDefault()
        setEnviando(true)
        setErro("")
        try {
            const payload = aba === "nova"
                ? { tipo: "nova", data: nova }
                : { tipo: "correcao", plantaId, plantaNome, campo, texto: texto.trim() }

            const res = await authFetch(`${API_URL}/suggestions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res) {
                setErro("Sessão expirada. Faça login novamente.")
                return
            }
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setErro(data.message || "Erro ao enviar a sugestão.")
                return
            }
            setOk(true)
        } catch {
            setErro("Erro ao conectar com o servidor.")
        } finally {
            setEnviando(false)
        }
    }

    if (ok) {
        return (
            <div className="container sugestao-page mt-4">
                <div className="text-center py-5">
                    <div className="favorites-page-empty__icon">🎉</div>
                    <h3 className="fw-semibold mb-2">Sugestão enviada!</h3>
                    <p className="text-muted mb-4">
                        Ela entra na fila de revisão e não vai direto ao catálogo. A equipe analisa e, se aprovada, ela é publicada.
                    </p>
                    <Link to="/sugerir" className="btn btn-sm btn-outline-success me-2" onClick={limparTudo}>
                        Enviar outra sugestão
                    </Link>
                    <Link to="/sugerir" className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => { setAba("minhas"); limparTudo(); }}>
                        📬 Ver minhas sugestões
                    </Link>
                    <Link to="/plantlist" className="btn btn-sm btn-success">
                        Explorar o catálogo
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container sugestao-page mt-4">
            <h3 className="sugestao-page__title mb-1 text-center">Sugerir planta / Reportar erro</h3>
            <p className="sugestao-page__sub mb-4 text-center">
                Sua sugestão passa por revisão antes de ser publicada. Apenas texto — fotos podem ser adicionadas depois pela equipe.
            </p>

            <div className="sugestao-tabs sugestao-tabs--center mb-4" role="tablist" aria-label="Tipo de sugestão">
                <button
                    type="button"
                    role="tab"
                    aria-selected={aba === "nova"}
                    className={`sugestao-tabs__tab ${aba === "nova" ? "is-active" : ""}`}
                    onClick={() => setAba("nova")}
                >
                    🌱 Sugerir nova planta
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={aba === "correcao"}
                    className={`sugestao-tabs__tab ${aba === "correcao" ? "is-active" : ""}`}
                    onClick={() => setAba("correcao")}
                >
                    ✏️ Reportar erro
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={aba === "minhas"}
                    className={`sugestao-tabs__tab ${aba === "minhas" ? "is-active" : ""}`}
                    onClick={() => setAba("minhas")}
                >
                    📬 Minhas sugestões
                </button>
            </div>

            {aba === "minhas" ? (
                <MinhasSugestoes
                    minhas={minhas}
                    carregando={carregandoMinhas}
                    erro={erroMinhas}
                    onAtualizar={recarregar}
                />
            ) : (
                <form onSubmit={enviar} className="sugestao-form card border-0 p-4 col-lg-8 mx-auto">
                {erro && <div className="alert alert-danger">{erro}</div>}

                {aba === "nova" ? (
                    <FormNovaPlanta
                        nova={nova}
                        tipos={tipos}
                        origens={origens}
                        setCampoNova={setCampoNova}
                    />
                ) : (
                    <FormCorrecao
                        plantas={plantas}
                        plantaId={plantaId}
                        onPlanta={(id) => {
                            setPlantaId(id)
                            const sel = plantas.find(p => p._id === id)
                            setPlantaNome(sel ? sel.name : "")
                        }}
                        campo={campo}
                        onCampo={setCampo}
                        texto={texto}
                        onTexto={setTexto}
                    />
                )}

                <div className="d-flex gap-2 mt-2">
                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={enviando || (aba === "nova" ? !nova.name.trim() : (!plantaId || !texto.trim()))}
                    >
                        {enviando ? "Enviando..." : "Enviar sugestão"}
                    </button>
                </div>
            </form>
            )}
        </div>
    )
}