import { useEffect, useState } from "react"

const SMALL_DIMENSION = 640

export default function PlantImage({ src, alt, className = "", fallback = "", aspectRatio, ...rest }) {
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

    const ratio = aspectRatio && Number(aspectRatio) > 0 ? Number(aspectRatio) : null

    return (
        <img
            src={currentSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={`${className}${isSmall ? " is-small" : ""}`}
            style={ratio ? { aspectRatio: String(ratio), width: "100%", height: "auto" } : undefined}
            onLoad={handleLoad}
            onError={handleError}
            {...rest}
        />
    )
}