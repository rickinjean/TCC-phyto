import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"

const FavoriteCard = ({ favorite, onRemove }) => {
    const plant = favorite.plant
    const images = plant.imagesPath?.length > 0 ? plant.imagesPath : plant.imagePath ? [plant.imagePath] : []
    const imageUrl = images.length > 0 ? `${API_URL}${images[0]}` : "https://via.placeholder.com/400x200/e8f0e8/6a9a6a?text=🌿"

    return (
        <div className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="plant-list-card card h-100 border-0">
                <div className="plant-list-card__image-wrapper position-relative">
                    <img
                        src={imageUrl}
                        alt={plant.name}
                        className="plant-list-card__image d-block w-100"
                    />
                    <button
                        className="plant-list-card__favorite is-favorite"
                        onClick={() => onRemove(plant._id, plant.name)}
                        type="button"
                        aria-label="Remover dos favoritos"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
                            to={`/plantdetails/${plant._id}`}
                        >
                            Detalhes
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Favorites() {
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadFavorites() {
            try {
                const res = await authFetch(`${API_URL}/favorites`)
                if (res && res.ok) {
                    const data = await res.json()
                    setFavorites(data)
                } else if (res) {
                    console.warn("Falha ao carregar favoritos:", res.status)
                }
            } catch (err) {
                console.error("Erro ao carregar favoritos:", err)
            } finally {
                setLoading(false)
            }
        }
        loadFavorites()
    }, [])

    async function handleRemove(plantId, plantName) {
        if (!window.confirm(`Remover "${plantName}" dos favoritos?`)) return
        try {
            await authFetch(`${API_URL}/favorites/${plantId}`, {
                method: "DELETE"
            })
            setFavorites(prev => prev.filter(f => f.plantId !== plantId))
        } catch (err) {
            console.error("Erro ao remover favorito:", err)
        }
    }

    return (
        <div className="plant-list-page container mt-4">
            <div className="mb-4">
                <h3 className="plant-list-page__title mb-0 fw-semibold">
                    Minhas Plantas Favoritas
                </h3>
                {!loading && (
                    <span className="plant-list-page__count">
                        {favorites.length} {favorites.length === 1 ? "planta favorita" : "plantas favoritas"}
                    </span>
                )}
            </div>

            <div className="row">
                {loading ? (
                    <div className="plant-list-loading col-12 text-center py-5">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        Carregando favoritos...
                    </div>
                ) : favorites.length > 0 ? (
                    favorites.map(fav => (
                        <FavoriteCard
                            key={fav._id}
                            favorite={fav}
                            onRemove={handleRemove}
                        />
                    ))
                ) : (
                    <div className="favorites-page-empty col-12">
                        <div className="favorites-page-empty__icon">💔</div>
                        <p className="favorites-page-empty__text">
                            Você ainda não adicionou nenhuma planta aos favoritos.
                        </p>
                        <Link to="/plantlist" className="favorites-page-empty__link">
                            Explorar o catálogo
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
