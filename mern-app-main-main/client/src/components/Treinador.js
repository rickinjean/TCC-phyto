import { useRef, useState } from "react"
import useTreinador from "../useTreinador"
import usePageTitle from "../usePageTitle"
import WebcamCapture from "./treinador/WebcamCapture"
import ClasseCard from "./treinador/ClasseCard"

// Treinador de Plantas (somente ADM): cria classes, adiciona exemplos por
// webcam ou upload e salva o modelo KNN no servidor para todos os usuários.
export default function Treinador() {
    usePageTitle("Treinador de Plantas", "Crie e treine modelos de identificação de plantas diretamente no Phytografia.", "/treinador")

    const { status, erroMsg, classes, adicionarClasse, renomearClasse, removerClasse, adicionarExemplo, adicionarExemplosDeArquivos, contagens, salvarModelo } = useTreinador()

    const [videoEl, setVideoEl] = useState(null)
    const [gravandoId, setGravandoId] = useState(null)
    const recIntervalRef = useRef(null)

    const [nome, setNome] = useState("")
    const [descricao, setDescricao] = useState("")
    const [salvando, setSalvando] = useState(false)
    const [msg, setMsg] = useState("")
    const [erroSalvar, setErroSalvar] = useState("")

    function inicioGravacao(classeId) {
        if (!videoEl) return
        setGravandoId(classeId)
        adicionarExemplo(videoEl, classeId)
        recIntervalRef.current = setInterval(function () {
            adicionarExemplo(videoEl, classeId)
        }, 120)
    }

    function fimGravacao() {
        if (recIntervalRef.current) clearInterval(recIntervalRef.current)
        recIntervalRef.current = null
        setGravandoId(null)
    }

    function handleUpload(files, classeId) {
        adicionarExemplosDeArquivos(files, classeId)
    }

    async function handleSalvar(e) {
        e.preventDefault()
        setSalvando(true)
        setMsg("")
        setErroSalvar("")
        try {
            const m = await salvarModelo(nome, descricao)
            setMsg(m + " — agora disponível no Identificador.")
            setNome("")
            setDescricao("")
        } catch (err) {
            setErroSalvar((err && err.message) || "Falha ao salvar o modelo.")
        } finally {
            setSalvando(false)
        }
    }

    if (status === "carregando") {
        return (
            <div className="container py-5 d-flex justify-content-center">
                <div className="d-flex align-items-center gap-2">
                    <div className="spinner-border text-primary" role="status" />
                    <span>Carregando a IA (MobileNet)… isso pode levar alguns segundos.</span>
                </div>
            </div>
        )
    }

    if (status === "erro") {
        return <div className="container py-5 text-danger">{erroMsg}</div>
    }

    return (
        <div className="treinador container py-4">
            <div className="treinador__cabecalho">
                <h1 className="treinador__titulo">🧪 Treinador de Plantas</h1>
                <p className="treinador__subtitulo">
                    Crie classes de plantas, adicione exemplos por câmera ou upload e salve o
                    modelo. Ele ficará disponível para todos os usuários no Identificador.
                </p>
            </div>

            <div className="treinador__layout">
                <div className="treinador__coluna-webcam">
                    <WebcamCapture onVideo={setVideoEl} />
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-success mt-3"
                        onClick={function () { adicionarClasse("") }}
                    >
                        ＋ Adicionar Classe
                    </button>
                </div>

                <div className="treinador__coluna-classes">
                    {classes.length === 0 ? (
                        <p className="text-muted">Nenhuma classe ainda. Crie uma classe e adicione exemplos.</p>
                    ) : (
                        <div className="treinador__grid">
                            {classes.map(function (c) {
                                return (
                                    <ClasseCard
                                        key={c.id}
                                        classe={c}
                                        contagem={contagens[c.id] || 0}
                                        desabilitado={status !== "pronto"}
                                        webcamAtiva={Boolean(videoEl)}
                                        gravando={gravandoId === c.id}
                                        onInicioGravacao={inicioGravacao}
                                        onFimGravacao={fimGravacao}
                                        onUpload={handleUpload}
                                        onRenomear={renomearClasse}
                                        onRemover={removerClasse}
                                    />
                                )
                            })}
                        </div>
                    )}

                    <form className="treinador__salvar mt-4" onSubmit={handleSalvar}>
                        <h3 className="treinador__salvar-titulo">Salvar modelo</h3>
                        <div className="mb-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nome do modelo (ex.: Plantas do Jardim)"
                                value={nome}
                                onChange={function (e) { setNome(e.target.value) }}
                                required
                            />
                        </div>
                        <div className="mb-2">
                            <textarea
                                className="form-control"
                                rows="2"
                                placeholder="Descrição (opcional)"
                                value={descricao}
                                onChange={function (e) { setDescricao(e.target.value) }}
                            />
                        </div>
                        <button type="submit" className="btn btn-success" disabled={salvando || classes.length === 0}>
                            {salvando ? "Salvando…" : "💾 Salvar modelo"}
                        </button>
                        {msg && <p className="text-success mt-2 mb-0 small">✓ {msg}</p>}
                        {erroSalvar && <p className="text-danger mt-2 mb-0 small">✗ {erroSalvar}</p>}
                    </form>
                </div>
            </div>
        </div>
    )
}