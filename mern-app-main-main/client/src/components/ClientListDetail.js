import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import { encodeId } from "../idCodec"
import PlantImage from "./PlantImage"
import getImageVariants from "../getImageVariants"

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' fill='%23dceee3'%3E%3Crect width='400' height='250'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%232f8a5d'%3E%F0%9F%8C%BF%3C/text%3E%3Ctext x='50%25' y='62%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2371827a'%3ESem imagem%3C/text%3E%3C/svg%3E"

function ItemCard({ item, onRemove }) {
    const plant = item.plant
    const images = plant.imagesPath?.length > 0 ? plant.imagesPath : plant.imagePath ? [plant.imagePath] : []
    const imageUrl = images.length > 0 ? `${API_URL}${images[0]}` : PLACEHOLDER_IMG
    const variants = getImageVariants(plant.imagesMeta, images[0], API_URL)

    return (
        <div className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="plant-list-card card h-100 border-0">
                <div className="plant-list-card__image-wrapper position-relative">
                    <PlantImage
                        src={imageUrl}
                        alt={plant.name}
                        className="plant-list-card__image d-block w-100"
                        fallback={PLACEHOLDER_IMG}
                        avifSrc={variants?.avifSrc}
                        webpSrc={variants?.webpSrc}
                        avifSrcset={variants?.avifSrcset}
                        webpSrcset={variants?.webpSrcset}
                        imgSrcset={variants?.imgSrcset}
                        sizesAttr="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw"
                    />
                    <button
                        type="button"
                        className="plant-list-card__favorite is-favorite"
                        aria-label="Remover desta lista"
                        title="Remover desta lista"
                        onClick={() => onRemove(item.plantId, plant.name)}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM8 9h8v10H8V9zm1.5-6h5L15 5H9l.5-2z" transform="scale(0.9) translate(1.3 1.3)" />
                        </svg>
                    </button>
                </div>

                <div className="plant-list-card__body card-body d-flex flex-column">
                    <h5 className="plant-list-card__title card-title mb-0 fw-semibold">
                        {plant.name}
                    </h5>
                    <p className="plant-list-card__scientific mb-2">
                        {plant.scientificName}
                    </p>
                    <p className="plant-list-card__description card-text flex-grow-1">
                        {plant.simpleDescription}
                    </p>

                    <div className="d-flex gap-2 mt-3">
                        <Link
                            className="plant-list-card__details btn btn-sm flex-grow-1"
                            to={`/plantdetails/${encodeId(plant._id)}`}
                        >
                            Detalhes
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ClientListDetail() {
    usePageTitle("Lista")
    const { id } = useParams()
    const [lista, setLista] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch(`${API_URL}/userlists/${id}/plants`)
                if (!res) {
                    setError("Sessão expirada. Faça login novamente.")
                    return
                }
                if (!res.ok) {
                    setError(`Erro ao carregar a lista: ${res.status}`)
                    return
                }
                const data = await res.json()
                setLista(data.lista)
                setItems(data.plants)
            } catch {
                setError("Erro ao conectar com o servidor")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    async function removerPlanta(itemId, plantName) {
        if (!window.confirm(`Remover "${plantName}" desta lista?`)) return
        try {
            const res = await authFetch(`${API_URL}/userlists/${id}/plants/${itemId}`, { method: "DELETE" })
            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                setError("Erro ao remover a planta da lista.")
                return
            }
            setItems(prev => prev.filter(it => it._id !== itemId))
        } catch {
            setError("Erro ao conectar com o servidor")
        }
    }

    return (
        <div className="plant-list-page container mt-4">
            <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <h3 className="plant-list-page__title mb-0 fw-semibold">
                        {lista ? lista.name : "Lista"}
                    </h3>
                    {!loading && (
                        <span className="plant-list-page__count">
                            {items.length} {items.length === 1 ? "planta" : "plantas"}
                        </span>
                    )}
                </div>
                <Link to="/minhas-listas" className="btn btn-sm btn-outline-success">
                    Voltar às listas
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando lista...
                </div>
            ) : error ? (
                <div className="alert alert-danger mx-2">{error}</div>
            ) : items.length === 0 ? (
                <div className="favorites-page-empty col-12">
                    <div className="favorites-page-empty__icon">🌱</div>
                    <p className="favorites-page-empty__text">
                        Esta lista ainda está vazia.
                    </p>
                    <Link to="/plantlist" className="favorites-page-empty__link">
                        Explorar o catálogo
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {items.map(item => (
                        <ItemCard key={String(item._id)} item={item} onRemove={removerPlanta} />
                    ))}
                </div>
            )}
        </div>
    )
}