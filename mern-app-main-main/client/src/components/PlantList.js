import React, { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'

const PlantCard = (props) => {
    const carouselRef = useRef(null)
    const carouselId = `plantImagesCarousel-${props.record._id}`
    const images = props.record.imagesPath?.length > 0 ? props.record.imagesPath : props.record.imagePath ? [props.record.imagePath] : []
    const isAdmin = props.role === "ADM"

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

    return (
        <div className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="plant-list-card card h-100 border-0">
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
                                    <img
                                        src={`${REACT_APP_YOUR_HOSTNAME}${src}`}
                                        alt={`${props.record.name} ${index + 1}`}
                                        className="plant-list-card__image d-block w-100"
                                        
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="carousel-item active">
                                <img
                                    src={props.record.image || "https://via.placeholder.com/400x200/e8f0e8/6a9a6a?text=🌿"}
                                    alt={props.record.name}
                                    className="plant-list-card__image d-block w-100"
                                    
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

                    <div className="d-flex gap-2 mt-3">
                        <Link
className="plant-list-card__details btn btn-sm flex-grow-1"
                            to={`/plantdetails/${props.record._id}`}
                            
                        >
                            Detalhes
                        </Link>
                        {isAdmin ? (
                            <>
                                <Link
className="plant-list-card__edit btn btn-sm flex-grow-1"
                                    to={`/editplant/${props.record._id}`}
                                    
                                >
                                    Editar
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

const EmptyState = ({ role }) => (
    <div className="plant-list-empty col-12 text-center py-5">
        <div className="plant-list-empty__icon">🌱</div>
        <p className="plant-list-empty__text">Nenhuma planta cadastrada ainda.</p>
        {role === "ADM" && (
            <Link
                to="/createplant"
                className="plant-list-add btn btn-sm mt-1"
            >
                Adicionar planta
            </Link>
        )}
    </div>
)

export default function PlantList({ role }) {
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getPlants() {
            try {
                const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/`)
                if (!response.ok) {
                    window.alert(`Um erro ocorreu: ${response.statusText}`)
                    return
                }
                const data = await response.json()
                setPlants(data)
            } finally {
                setLoading(false)
            }
        }
        getPlants()
    }, [])

    async function deleteRecord(id) {
        if (!window.confirm("Deseja remover esta planta da lista?")) return

        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/${id}`, { method: "DELETE", headers })
        setPlants(prev => prev.filter(p => p._id !== id))
    }

    return (
        <div className="plant-list-page container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="plant-list-page__title mb-0 fw-semibold">
                        Lista de Plantas
                    </h3>
                    {!loading && plants.length > 0 && (
                        <span className="plant-list-page__count">
                            {plants.length} {plants.length === 1 ? "planta" : "plantas"} cadastradas
                        </span>
                    )}
                </div>
                {role === "ADM" && (
                    <Link
                        to="/createplant"
                        className="plant-list-add btn btn-sm"
                    >
                        + Nova planta
                    </Link>
                )}
            </div>

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
                        />
                    ))
                ) : (
                    <EmptyState role={role} />
                )}
            </div>
        </div>
    )
}