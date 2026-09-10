import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import { encodeId } from "../idCodec"
import PlantImage from "./PlantImage"
import { imgVariantProps } from "../getImageVariants"
import { PLACEHOLDER_CARD } from "../placeholderImg"
import FavoriteButton from "./FavoriteButton"

export default function PlantCard({
    record,
    role,
    canFavorite = false,
    onOpenPicker,
    corColecao,
    qtdColecoes = 0,
    nomesColecoes = [],
    onRemove,
    removeId,
    deleteRecord,
    carousel = true,
}) {
    const carouselRef = useRef(null)
    const carouselId = `plantImagesCarousel-${record._id}`
    const images = record.imagesPath?.length > 0 ? record.imagesPath : record.imagePath ? [record.imagePath] : []
    const isAdmin = role === "ADM"
    const showCarousel = carousel && images.length > 1
    const textoColecoes = qtdColecoes > 1
        ? `Em ${qtdColecoes} coleções: ${nomesColecoes.join(", ")}`
        : qtdColecoes === 1
            ? "Em uma coleção — tocar para gerenciar"
            : "Adicionar a uma coleção"

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
                <div className="plant-list-card__image-wrapper position-relative">
                    <div ref={carouselRef} className="plant-list-card__carousel carousel slide" id={carouselId} data-bs-interval="false">
                        {showCarousel && (
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
                            {showCarousel ? (
                                images.map((src, index) => (
                                    <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                                        <PlantImage
                                            src={`${API_URL}${src}`}
                                            alt={`${record.name} ${index + 1}`}
                                            className="plant-list-card__image d-block w-100"
                                            fallback={PLACEHOLDER_CARD}
                                            sizesAttr="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw"
                                            {...imgVariantProps(record.imagesMeta, src, API_URL)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="carousel-item active">
                                    <PlantImage
                                        src={images.length > 0 ? `${API_URL}${images[0]}` : (record.imagePath || PLACEHOLDER_CARD)}
                                        alt={record.name}
                                        className="plant-list-card__image d-block w-100"
                                        fallback={PLACEHOLDER_CARD}
                                        sizesAttr="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw"
                                        {...imgVariantProps(record.imagesMeta, images[0], API_URL)}
                                    />
                                </div>
                            )}
                        </div>

                        {showCarousel && (
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

                    {onRemove ? (
                        <button
                            type="button"
                            className="plant-list-card__favorite is-favorite"
                            aria-label="Remover desta lista"
                            title="Remover desta lista"
                            onClick={() => onRemove(removeId || record._id, record.name)}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM8 9h8v10H8V9zm1.5-6h5L15 5H9l.5-2z" transform="scale(0.9) translate(1.3 1.3)" />
                            </svg>
                        </button>
                    ) : canFavorite && (
                        <FavoriteButton
                            corColecao={corColecao}
                            qtdColecoes={qtdColecoes}
                            texto={textoColecoes}
                            onClick={() => onOpenPicker(record)}
                        />
                    )}
                </div>

                <div className="plant-list-card__body card-body d-flex flex-column">
                    <h5 className="plant-list-card__title card-title mb-0 fw-semibold">
                        {record.name}
                    </h5>
                    <p className="plant-list-card__scientific mb-2">
                        {record.scientificName}
                    </p>
                    <p className="plant-list-card__description card-text flex-grow-1">
                        {record.simpleDescription}
                    </p>

                    <div className="d-flex gap-2 flex-wrap mt-3">
                        <Link
                            className="plant-list-card__details btn btn-sm flex-grow-1"
                            to={`/plantdetails/${encodeId(record._id)}`}
                        >
                            Detalhes
                        </Link>
                        {isAdmin && !onRemove && (
                            <>
                                <Link
                                    className="plant-list-card__edit btn btn-sm flex-grow-1"
                                    to={`/editplant/${encodeId(record._id)}`}
                                >
                                    Editar
                                </Link>
                                <Link
                                    className="plant-list-card__clone btn btn-sm flex-grow-1"
                                    to={`/createplant?clone=${encodeId(record._id)}`}
                                >
                                    Clonar
                                </Link>
                                <button
                                    className="plant-list-card__delete btn btn-sm"
                                    onClick={() => deleteRecord(record._id)}
                                >
                                    Excluir
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}