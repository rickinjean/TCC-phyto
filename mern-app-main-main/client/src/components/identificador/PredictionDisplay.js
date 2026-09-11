import { useState } from "react"

// Exibe o resultado da predição: destaca apenas a planta mais provável e
// oferece "Ver outras possibilidades" com as probabilidades de todas as classes.
export default function PredictionDisplay({ predicoes, status, erroMsg }) {
    const [aberto, setAberto] = useState(false)

    if (status === "sem-modelo") {
        return <div className="prediction prediction--muted">Selecione um modelo acima para começar.</div>
    }

    if (status === "carregando") {
        return (
            <div className="prediction prediction--muted d-flex align-items-center gap-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                <span>Carregando modelo de IA…</span>
            </div>
        )
    }

    if (status === "erro") {
        return <div className="prediction prediction--erro">{erroMsg || "Falha ao carregar o modelo."}</div>
    }

    if (!predicoes || predicoes.length === 0) {
        return (
            <div className="prediction prediction--muted">
                Aponte a câmera para uma planta ou envie uma foto para identificar.
            </div>
        )
    }

    const topo = predicoes[0]
    const pctTopo = Math.round(topo.prob * 100)
    const demais = predicoes.slice(1)

    return (
        <div className="prediction">
            <div className="prediction__resumo">
                <div className="prediction__planta">
                    <span className="prediction__topo-icone" aria-hidden="true">🌿</span>
                    <div className="prediction__topo-texto">
                        <span className="prediction__topo-rotulo">Planta mais provável</span>
                        <strong className="prediction__topo-nome">{topo.label || "Desconhecida"}</strong>
                    </div>
                </div>
                <div className="prediction__barra">
                    <div className="prediction__barra-fill" style={{ width: pctTopo + "%" }} />
                </div>
                <div className="prediction__pct">{pctTopo}%</div>
            </div>

            {(demais.length > 0 || topo.prob < 0.99) && (
                <button
                    type="button"
                    className="btn btn-link btn-sm prediction__toggle"
                    onClick={function () { setAberto(function (v) { return !v }) }}
                    aria-expanded={aberto}
                >
                    {aberto ? "▲ Esconder outras possibilidades" : "▾ Ver outras possibilidades"}
                </button>
            )}

            {aberto && (
                <div className="prediction__lista">
                    <div className="prediction__linha prediction__linha--topo">
                        <span className="prediction__linha-nome">{topo.label}</span>
                        <div className="prediction__barra prediction__barra--linha">
                            <div className="prediction__barra-fill" style={{ width: pctTopo + "%" }} />
                        </div>
                        <span className="prediction__linha-pct">{pctTopo}%</span>
                    </div>
                    {demais.map(function (p, i) {
                        const pct = Math.round(p.prob * 100)
                        return (
                            <div className="prediction__linha" key={i}>
                                <span className="prediction__linha-nome">{p.label}</span>
                                <div className="prediction__barra prediction__barra--linha">
                                    <div className="prediction__barra-fill" style={{ width: pct + "%" }} />
                                </div>
                                <span className="prediction__linha-pct">{pct}%</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}