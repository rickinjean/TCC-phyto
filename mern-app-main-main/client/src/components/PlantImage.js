import { useEffect, useState } from "react"

const SMALL_DIMENSION = 640

export default function PlantImage({ src, alt, className = "", fallback = "", ...rest }) {
    const [currentSrc, setCurrentSrc] = useState(src)
    const [isSmall, setIsSmall] = useState(false)

    useEffect(() => {
        setCurrentSrc(src)
        setIsSmall(false)
    }, [src])

    function handleLoad(e) {
        const el = e.currentTarget
        const w = el.naturalWidth || 0
        const h = el.naturalHeight || 0
        setIsSmall(w > 0 && h > 0 && (w < SMALL_DIMENSION || h < SMALL_DIMENSION))
    }

    function handleError() {
        if (fallback && currentSrc !== fallback) setCurrentSrc(fallback)
    }

    return (
        <img
            src={currentSrc}
            alt={alt}
            loading="lazy"
            className={`${className}${isSmall ? " is-small" : ""}`}
            onLoad={handleLoad}
            onError={handleError}
            {...rest}
        />
    )
}