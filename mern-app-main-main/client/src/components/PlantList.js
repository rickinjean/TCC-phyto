import React, { useState, useEffect, useRef, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import { encodeId } from "../idCodec"
import PlantImage from "./PlantImage"

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' fill='%23dceee3'%3E%3Crect width='400' height='250'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%232f8a5d'%3E%F0%9F%8C%BF%3C/text%3E%3Ctext x='50%25' y='62%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2371827a'%3ESem imagem%3C/text%3E%3C/svg%3E"

const FILTER_FIELDS = [
    { key: "type", label: "Tipo" },
    { key: "light", label: "Luz" },
    { key: "height", label: "Altura" },
    { key: "flowercolor", label: "Cor da Flor" },
    { key: "dificulty", label: "Dificuldade" },
    { key: "toxicity", label: "Toxicidade" },
    { key: "origin", label: "Origem" },
    { key: "soil", label: "Solo" },
]

const PlantCard = (props) => {
    const carouselRef = useRef(null)
    const carouselId = `plantImagesCarousel-${props.record._id}`
    const images = props.record.imagesPath?.length > 0 ? props.record.imagesPath : props.record.imagePath ? [props.record.imagePath] : []
    const isAdmin = props.role === "ADM"
    const isFav = props.favoriteIds?.has(props.record._id)

    useEffect(() => {
        if (typeof window !== "undefined" && window.bootstrap?.Carousel && carouselRef.current) {
            const instance = window.bootstrap.Carousel.getOrCreateInstance(carouselRef.current, {
                interval: false,
                ride: false,
                pause: false,
            })
            instance.pause()
        }
    }, [])

    async function toggleFavorite(e) {
        e.preventDefault()
        e.stopPropagation()
        try {
            if (isFav) {
                const res = await authFetch(`${API_URL}/favorites/${props.record._id}`, {
                    method: "DELETE"
                })
                if (res && res.ok) {
                    props.onFavoriteToggle(props.record._id, false)
                }
            } else {
                const res = await authFetch(`${API_URL}/favorites`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plantId: props.record._id })
                })
                if (res && res.ok) {
                    props.onFavoriteToggle(props.record._id, true)
                }
            }
        } catch (err) {
            console.error("Erro ao atualizar favorito:", err)
        }
    }

    return (
        <div className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="plant-list-card card h-100 border-0">
                <div className="plant-list-card__image-wrapper position-relative">
                    <div ref={carouselRef} className="plant-list-card__carousel carousel slide" id={carouselId} data-bs-interval="false">
                        {images.length > 1 && (
                            <div className="carousel-indicators">
                                {images.map((_, index) => (
                                    <button
                                        type="button"
                                        key={index}
                                        data-bs-target={`#${carouselId}`}
                                        data-bs-slide-to={index}
                                        className={index === 0 ? "active" : ""}
                                        aria-current={index === 0 ? "true" : undefined}
                                        aria-label={`Imagem ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="carousel-inner plant-list-card__carousel-inner">
                            {images.length > 0 ? (
                                images.map((src, index) => (
                                    <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                                        <PlantImage
                                            src={`${API_URL}${src}`}
                                            alt={`${props.record.name} ${index + 1}`}
                                            className="plant-list-card__image d-block w-100"
                                            fallback={PLACEHOLDER_IMG}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="carousel-item active">
                                    <PlantImage
                                        src={props.record.imagePath || PLACEHOLDER_IMG}
                                        alt={props.record.name}
                                        className="plant-list-card__image d-block w-100"
                                        fallback={PLACEHOLDER_IMG}
                                    />
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <>
                                <button
                                    className="carousel-control-prev"
                                    type="button"
                                    data-bs-target={`#${carouselId}`}
                                    data-bs-slide="prev"
                                >
                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                    <span className="visually-hidden">Anterior</span>
                                </button>
                                <button
                                    className="carousel-control-next"
                                    type="button"
                                    data-bs-target={`#${carouselId}`}
                                    data-bs-slide="next"
                                >
                                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                    <span className="visually-hidden">Próximo</span>
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        className={`plant-list-card__favorite ${isFav ? "is-favorite" : ""}`}
                        onClick={toggleFavorite}
                        type="button"
                        aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                    </div>

                <div className="plant-list-card__body card-body d-flex flex-column">
                    <h5 className="plant-list-card__title card-title mb-0 fw-semibold">
                        {props.record.name}
                    </h5>
                    <p className="plant-list-card__scientific mb-2">
                        {props.record.scientificName}
                    </p>
                    <p className="plant-list-card__description card-text flex-grow-1">
                        {props.record.simpleDescription}
                    </p>

                    <div className="d-flex gap-2 flex-wrap mt-3">
                        <Link
className="plant-list-card__details btn btn-sm flex-grow-1"
                            to={`/plantdetails/${encodeId(props.record._id)}`}
                            
                        >
                            Detalhes
                        </Link>
                        {isAdmin ? (
                            <>
                                <Link
className="plant-list-card__edit btn btn-sm flex-grow-1"
                                    to={`/editplant/${encodeId(props.record._id)}`}
                                    
                                >
                                    Editar
                                </Link>
                                <Link
className="plant-list-card__clone btn btn-sm flex-grow-1"
                                    to={`/createplant?clone=${encodeId(props.record._id)}`}
                                    
                                >
                                    Clonar
                                </Link>
                                <button
className="plant-list-card__delete btn btn-sm"
                                    onClick={() => props.deleteRecord(props.record._id)}
                                    
                                >
                                    Excluir
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

const EmptyState = ({ hasActiveFilters, onClear }) => (
    <div className="plant-list-empty col-12 text-center py-5">
        <div className="plant-list-empty__icon">🌱</div>
        <p className="plant-list-empty__text">
            {hasActiveFilters
                ? "Nenhuma planta encontrada para os filtros aplicados."
                : "Nenhuma planta cadastrada ainda."}
        </p>
        {hasActiveFilters && (
            <button
                className="plant-list-empty__clear btn btn-sm btn-outline-secondary"
                onClick={onClear}
                type="button"
            >
                Limpar Filtros
            </button>
        )}
    </div>
)

export default function PlantList({ role }) {
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [collectionOptions, setCollectionOptions] = useState({})
    const [favoriteIds, setFavoriteIds] = useState(new Set())
    const [searchParams, setSearchParams] = useSearchParams()

    const filtersFromURL = {}
    FILTER_FIELDS.forEach(({ key }) => {
        const val = searchParams.get(key)
        if (val) filtersFromURL[key] = val
    })
    const searchFromURL = searchParams.get("search") || ""
    const [filters, setFilters] = useState(filtersFromURL)
    const [searchInput, setSearchInput] = useState(searchFromURL)
    const [searchText, setSearchText] = useState(searchFromURL)
    const [filtersOpen, setFiltersOpen] = useState(false)

    const updateUrl = useCallback((nextFilters, nextSearch) => {
        const params = new URLSearchParams()
        Object.entries(nextFilters).forEach(([k, v]) => { if (v) params.append(k, v) })
        if (nextSearch) params.append("search", nextSearch)
        setSearchParams(params, { replace: true })
    }, [setSearchParams])

    useEffect(() => {
        async function loadCollections() {
            const entries = await Promise.all(
                FILTER_FIELDS.map(async ({ key }) => {
                    try {
                        const res = await authFetch(`${API_URL}/collections/${key}`)
                        if (!res || !res.ok) {
                            console.warn(`Falha ao carregar collection "${key}": ${res?.status}`)
                            return [key, []]
                        }
                        const data = await res.json()
                        return [key, data]
                    } catch (err) {
                        console.error(`Erro ao buscar collection "${key}":`, err)
                        return [key, []]
                    }
                })
            )
            setCollectionOptions(Object.fromEntries(entries))
        }
        loadCollections()
    }, [])

    useEffect(() => {
        async function loadFavorites() {
            try {
                const res = await authFetch(`${API_URL}/favorites`)
                if (res && res.ok) {
                    const data = await res.json()
                    setFavoriteIds(new Set(data.map(f => String(f.plantId))))
                } else if (res) {
                    console.warn("Falha ao carregar favoritos:", res.status)
                }
            } catch (err) {
                console.error("Erro ao carregar favoritos:", err)
            }
        }
        loadFavorites()
    }, [])

    const fetchPlants = useCallback(async (activeFilters, searchQuery) => {
        setLoading(true)
        setFetchError(null)
        try {
            const params = new URLSearchParams()
            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value) params.append(key, value)
            })
            if (searchQuery) params.append("search", searchQuery)
            const qs = params.toString()
            const url = qs ? `${API_URL}/plant?${qs}` : `${API_URL}/plant/`
            const response = await fetch(url)
            if (!response.ok) {
                setFetchError(`Erro ao carregar plantas: ${response.statusText}`)
                return
            }
            const data = await response.json()
            setPlants(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPlants(filters, searchText)
    }, [filters, searchText, fetchPlants])

    function handleFilterChange(key, value) {
        setFilters(prev => {
            const next = { ...prev }
            if (value) {
                next[key] = value
            } else {
                delete next[key]
            }
            updateUrl(next, searchText)
            return next
        })
    }

    function clearFilters() {
        setFilters({})
        setSearchText("")
        setSearchInput("")
        setSearchParams({}, { replace: true })
    }

    // Debounce: buscas são disparadas só quando o campo para de mudar (350ms)
    // ou no submit (Enter/Buscar).
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchText) {
                const next = searchInput.trim()
                setSearchText(next)
                updateUrl(filters, next)
            }
        }, 350)
        return () => clearTimeout(timer)
    }, [searchInput, searchText, filters, updateUrl])

    function handleSearchSubmit(e) {
        e.preventDefault()
        const next = searchInput.trim()
        setSearchText(next)
        updateUrl(filters, next)
    }

    const hasActiveFilters = Object.keys(filters).length > 0 || searchInput.trim().length > 0

    function handleFavoriteToggle(plantId, added) {
        setFavoriteIds(prev => {
            const next = new Set(prev)
            if (added) {
                next.add(plantId)
            } else {
                next.delete(plantId)
            }
            return next
        })
    }

    async function deleteRecord(id) {
        if (!window.confirm("Deseja remover esta planta da lista?")) return

        const res = await authFetch(`${API_URL}/plant/${id}`, { method: "DELETE" })
        if (res && res.ok) {
            setPlants(prev => prev.filter(p => p._id !== id))
        }
    }

    return (
        <div className="plant-list-page container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="plant-list-page__title mb-0 fw-semibold">
                        Lista de Plantas
                    </h3>
                    {!loading && (
                        <span className="plant-list-page__count">
                            {plants.length} {plants.length === 1 ? "planta" : "plantas"} {hasActiveFilters ? "encontradas" : "cadastradas"}
                        </span>
                    )}
                </div>
                {role === "ADM" && (
                    <div className="d-flex gap-2">
                        <Link
                            to="/createplant"
                            className="plant-list-add btn btn-sm"
                        >
                            + Nova planta
                        </Link>
                    </div>
                )}
            </div>

            <form onSubmit={handleSearchSubmit} className="plant-search mb-3" role="search">
                <div className="plant-search__box d-flex align-items-center">
                    <i className="fas fa-magnifying-glass plant-search__icon" aria-hidden="true"></i>
                    <input
                        type="text"
                        className="form-control plant-search__input"
                        placeholder="Buscar planta por nome ou nome científico..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        aria-label="Buscar planta"
                    />
                    <button type="submit" className="btn plant-search__btn">
                        Buscar
                    </button>
                </div>
            </form>

            <div className="plant-filters-toolbar mb-4">
                <div className="d-flex justify-content-between align-items-center gap-2">
                    <button
                        type="button"
                        className={`plant-filters__toggle btn ${filtersOpen ? "is-open" : ""}`}
                        onClick={() => setFiltersOpen(o => !o)}
                        aria-expanded={filtersOpen}
                        aria-controls="plant-filters-body"
                    >
                        <i className={`fas fa-chevron-${filtersOpen ? "up" : "down"} plant-filters__chevron`} aria-hidden="true"></i>
                        Filtros
                        {Object.keys(filters).length > 0 && (
                            <span className="plant-filters__badge">{Object.keys(filters).length}</span>
                        )}
                    </button>
                    {hasActiveFilters && (
                        <button
                            className="plant-filters__clear btn btn-sm btn-outline-secondary"
                            onClick={clearFilters}
                            type="button"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
                {filtersOpen && (
                    <div className="plant-filters mt-2" id="plant-filters-body">
                        <div className="row g-2">
                            {FILTER_FIELDS.map(({ key, label }) => (
                                <div key={key} className="col-6 col-md-4 col-lg-3">
                                    <select
                                        className="form-select form-select-sm plant-filters__select"
                                        value={filters[key] || ""}
                                        onChange={(e) => handleFilterChange(key, e.target.value)}
                                        aria-label={label}
                                    >
                                        <option value="">{label}</option>
                                        {(collectionOptions[key] || []).map(opt => (
                                            <option key={opt._id} value={opt._id}>{opt.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {fetchError && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3" role="alert">
                    <span>{fetchError}</span>
                    <button type="button" className="btn-close" onClick={() => setFetchError(null)} aria-label="Fechar" />
                </div>
            )}

            <div className="row">
                {loading ? (
                    <div className="plant-list-loading col-12 text-center py-5">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        Carregando plantas...
                    </div>
                ) : plants.length > 0 ? (
                    plants.map(record => (
                        <PlantCard
                            key={record._id}
                            record={record}
                            role={role}
                            deleteRecord={deleteRecord}
                            favoriteIds={favoriteIds}
                            onFavoriteToggle={handleFavoriteToggle}
                        />
                    ))
                ) : (
                    <EmptyState
                        hasActiveFilters={hasActiveFilters}
                        onClear={clearFilters}
                    />
                )}
            </div>
        </div>
    )
}