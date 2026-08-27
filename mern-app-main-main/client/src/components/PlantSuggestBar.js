import React, { useRef, useState } from "react"
import API_URL from "../config"

// Campos que são EXCLUÍDOS do auto-preenchimento (possuem coleção própria com valores fixos
// ou precisam de revisão manual pelo ADM)
const SKIP_FIELDS = [
    "fruit", "origin", "type", "propagation", "toxicity", "dificulty",
]

export default function PlantSuggestBar({ onApply, placeholder = "Digite o nome da planta (ex: banana, aipim, tomate)..." }) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [searched, setSearched] = useState(false)
    const debounce = useRef(null)

    async function runSearch(q) {
        const term = (q || query).trim()
        if (!term) return
        setLoading(true)
        setError("")
        setSearched(true)
        try {
            const res = await fetch(`${API_URL}/plant/suggest?${new URLSearchParams({ q: term })}`)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                setResults([])
                setError(err.message || "Nenhuma planta encontrada.")
                return
            }
            const data = await res.json()
            setResults(data.results || [])
        } catch {
            setResults([])
            setError("Erro ao consultar o servidor.")
        } finally {
            setLoading(false)
        }
    }

    function handleChange(value) {
        setQuery(value)
        setResults([])
        clearTimeout(debounce.current)
        if (value.trim().length >= 3) {
            debounce.current = setTimeout(() => runSearch(value), 600)
        }
    }

    // Ignora a tecla Enter para evitar recarregar a página pelo form
    function handleKeyDown(e) {
        if (e.key === "Enter") e.preventDefault()
    }

    function applyAll(r) {
        const onlyMappable = {}
        Object.entries(r.fields || {}).forEach(([k, v]) => {
            if (SKIP_FIELDS.includes(k)) return
            if (v === null || v === undefined) return
            onlyMappable[k] = String(v)
        })
        onApply(onlyMappable)
        setResults([])
        setQuery("")
        setSearched(false)
    }

    return (
        <div className="plant-suggest-bar">
            <div className="plant-suggest-bar__head">
                <span className="plant-suggest-bar__icon">🔎</span>
                <div className="flex-grow-1">
                    <label className="plant-suggest-bar__title">Preenchimento automático</label>
                    <p className="plant-suggest-bar__hint">
                        Digite o nome da planta e o sistema tentará preencher todos os campos automaticamente.
                        Campos marcados com <span className="badge bg-warning text-dark">revisar</span> precisam de confirmação pelo ADM.
                    </p>
                    <div className="plant-suggest-bar__input-row">
                        <input
                            type="text"
                            className="form-control"
                            value={query}
                            onChange={e => handleChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => runSearch()}
                            disabled={loading}
                        >
                            {loading ? "Buscando..." : "Buscar"}
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-warning mt-2 mb-0 py-2">{error}</div>}

            {loading && <div className="plant-suggest-bar__status mt-2">Consultando GBIF, Trefle, Wikipedia e banco local...</div>}

            {!loading && searched && results.length === 0 && !error && (
                <div className="alert alert-info mt-2 mb-0 py-2">Nenhuma planta correspondente encontrada.</div>
            )}

            {!loading && results.length > 0 && (
                <div className="plant-suggest-bar__results mt-2">
                    {results.map((r, i) => (
                        <div className="plant-suggest-bar__result" key={i}>
                            <div className="plant-suggest-bar__result-top">
                                <div>
                                    <strong>{r.name}</strong>
                                    {r.scientificName && (
                                        <span className="plant-suggest-bar__sci px-2">{r.scientificName}</span>
                                    )}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-success">{r.filledCount} campos</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        onClick={() => applyAll(r)}
                                    >
                                        Aplicar tudo
                                    </button>
                                </div>
                            </div>
                            <div className="plant-suggest-bar__preview">
                                {Object.entries(r.fields || {})
                                    .filter(([k]) => !SKIP_FIELDS.includes(k))
                                    .slice(0, 8)
                                    .map(([k, v]) => (
                                        <span className="plant-suggest-bar__chip" key={k}>
                                            <b>{k}:</b> {v}
                                            {r.filledBy && r.filledBy[k] === "local" ? (
                                                <span className="badge bg-info text-dark ms-1">banco local</span>
                                            ) : (
                                                <span className="badge bg-secondary ms-1">{r.filledBy?.[k] || "api"}</span>
                                            )}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
