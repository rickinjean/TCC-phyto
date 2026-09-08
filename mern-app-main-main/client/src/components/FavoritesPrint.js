import { useState, useEffect } from "react"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"

function melhorImagem(plant) {
    const path = plant.imagesPath?.length > 0 ? plant.imagesPath[0] : plant.imagePath || null
    if (!path) return null
    const meta = (Array.isArray(plant.imagesMeta) ? plant.imagesMeta : []).find(m => m && (
        m.path === path || m.webpPath === path
    ))
    const sizes = meta?.sizes || {}
    const url = sizes["800"]?.webp || sizes["400"]?.webp || meta?.webpPath || meta?.path || path
    return `${API_URL}${url}`
}

function dataCurta(iso) {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function FavoritesPrint() {
    usePageTitle("Minhas Plantas Favoritas — Impressão")
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Página de impressão sempre em tema claro (economia de tinta).
    useEffect(() => {
        document.documentElement.dataset.theme = "light"
    }, [])

    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                const res = await authFetch(`${API_URL}/favorites`)
                if (!res) {
                    if (!cancelled) setError("Sessão expirada. Faça login novamente.")
                    return
                }
                if (!res.ok) {
                    if (!cancelled) setError(`Erro ao carregar favoritos: ${res.status}`)
                    return
                }
                const data = await res.json()
                if (!cancelled) setFavorites((data || []).filter(f => f && f.plant))
            } catch {
                if (!cancelled) setError("Erro ao conectar com o servidor")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        if (loading || error || favorites.length === 0) return
        const t = setTimeout(() => {
            try { window.focus(); window.print() } catch (err) { console.error(err) }
        }, 600)
        return () => clearTimeout(t)
    }, [loading, error, favorites])

    const dataGeracao = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric"
    })

    return (
        <div className="print-page">
            <header className="print-page__header">
                <div>
                    <div className="print-page__brand">Phytografia</div>
                    <h1 className="print-page__title">Minhas Plantas Favoritas</h1>
                </div>
                <div className="print-page__meta">Gerado em {dataGeracao}</div>
            </header>

            {loading ? (
                <div className="print-page__status">Carregando favoritos...</div>
            ) : error ? (
                <div className="print-page__status">
                    {error}
                    <br />
                    <a className="btn btn-sm btn-outline-success mt-3" href="/favoritos">Voltar aos favoritos</a>
                </div>
            ) : favorites.length === 0 ? (
                <div className="print-page__status">
                    Nenhuma planta favorita para imprimir.
                    <br />
                    <a className="btn btn-sm btn-outline-success mt-3" href="/favoritos">Voltar aos favoritos</a>
                </div>
            ) : (
                <>
                    <p className="print-page__count">
                        {favorites.length} {favorites.length === 1 ? "planta favorita" : "plantas favoritas"}
                    </p>
                    <main className="print-page__grid">
                        {favorites.map(fav => {
                            const plant = fav.plant
                            const img = melhorImagem(plant)
                            const data = dataCurta(fav.createdAt)
                            return (
                                <article className="print-page__card" key={fav._id}>
                                    {img ? (
                                        <div className="print-page__imgwrap">
                                            <img src={img} alt={`Foto de ${plant.name}`} decoding="async" />
                                        </div>
                                    ) : (
                                        <div className="print-page__imgwrap">
                                            <span className="print-page__noimg" aria-hidden="true">🌿</span>
                                        </div>
                                    )}
                                    <div className="print-page__body">
                                        <h2 className="print-page__name">{plant.name}</h2>
                                        {plant.scientificName && (
                                            <div className="print-page__sci">{plant.scientificName}</div>
                                        )}
                                        {plant.simpleDescription && (
                                            <p className="print-page__desc">{plant.simpleDescription}</p>
                                        )}
                                        {data && (
                                            <div className="print-page__date">Adicionada em {data}</div>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </main>
                </>
            )}

            <div className="print-page__toolbar">
                <button type="button" className="print-page__btn" onClick={() => window.print()}>
                    Imprimir / Salvar como PDF
                </button>
                <a className="print-page__btn print-page__btn--secondary" href="/favoritos" rel="noopener">
                    Voltar
                </a>
            </div>
        </div>
    )
}