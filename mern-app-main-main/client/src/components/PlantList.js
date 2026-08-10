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
            <div
                className="card h-100 border-0"
                style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-3px)"
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.13)"
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"
               }}
            >
                <div ref={carouselRef} className="carousel slide" id={carouselId} data-bs-interval="false" style={{ position: "relative", height: "180px", overflow: "hidden", background: "#f0f4f0" }}>
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

                    <div className="carousel-inner" style={{ height: "180px" }}>
                        {images.length > 0 ? (
                            images.map((src, index) => (
                                <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                                    <img
                                        src={`${REACT_APP_YOUR_HOSTNAME}${src}`}
                                        alt={`${props.record.name} ${index + 1}`}
                                        className="d-block w-100"
                                        style={{ width: "100%", height: "180px", objectFit: "cover" }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="carousel-item active">
                                <img
                                    src={props.record.image || "https://via.placeholder.com/400x200/e8f0e8/6a9a6a?text=🌿"}
                                    alt={props.record.name}
                                    className="d-block w-100"
                                    style={{ width: "100%", height: "180px", objectFit: "cover" }}
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

                <div className="card-body d-flex flex-column" style={{ padding: "1.1rem 1.2rem" }}>
                    <h5 className="card-title mb-0 fw-semibold" style={{ fontSize: "1rem", color: "#1a2e1a" }}>
                        {props.record.name}
                    </h5>
                    <p className="mb-2" style={{ fontSize: "0.78rem", color: "#7a9e7a", fontStyle: "italic" }}>
                        {props.record.scientificName}
                    </p>
                    <p className="card-text flex-grow-1" style={{ fontSize: "0.875rem", color: "#555", lineHeight: "1.5" }}>
                        {props.record.simpleDescription}
                    </p>

                    <div className="d-flex gap-2 mt-3">
                        <Link
                            className="btn btn-sm flex-grow-1"
                            to={`/plantdetails/${props.record._id}`}
                            style={{
                                background: "#3a7d44",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                            }}
                        >
                            Detalhes
                        </Link>
                        {isAdmin ? (
                            <>
                                <Link
                                    className="btn btn-sm flex-grow-1"
                                    to={`/editplant/${props.record._id}`}
                                    style={{
                                        background: "#f5f5f5",
                                        color: "#444",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        fontSize: "0.8rem",
                                        fontWeight: "500",
                                    }}
                                >
                                    Editar
                                </Link>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => props.deleteRecord(props.record._id)}
                                    style={{
                                        background: "transparent",
                                        color: "#c0392b",
                                        border: "1px solid #e0b0ac",
                                        borderRadius: "8px",
                                        fontSize: "0.8rem",
                                        padding: "0.25rem 0.6rem",
                                    }}
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
    <div className="col-12 text-center py-5" style={{ color: "#aaa" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🌱</div>
        <p style={{ fontSize: "0.95rem" }}>Nenhuma planta cadastrada ainda.</p>
        {role === "ADM" && (
            <Link
                to="/createplant"
                className="btn btn-sm mt-1"
                style={{
                    background: "#3a7d44",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                }}
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
        <div className="container mt-4" style={{ maxWidth: "1100px" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="mb-0 fw-semibold" style={{ color: "#1a2e1a", fontSize: "1.4rem" }}>
                        Lista de Plantas
                    </h3>
                    {!loading && plants.length > 0 && (
                        <span style={{ fontSize: "0.8rem", color: "#888" }}>
                            {plants.length} {plants.length === 1 ? "planta" : "plantas"} cadastradas
                        </span>
                    )}
                </div>
                {role === "ADM" && (
                    <Link
                        to="/createplant"
                        className="btn btn-sm"
                        style={{
                            background: "#3a7d44",
                            color: "#fff",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: "500",
                            padding: "0.4rem 1rem",
                        }}
                    >
                        + Nova planta
                    </Link>
                )}
            </div>

            <div className="row">
                {loading ? (
                    <div className="col-12 text-center py-5" style={{ color: "#aaa" }}>
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