import { useEffect, useState } from "react"

const SMALL_DIMENSION = 640

export default function PlantImage({
    src,
    alt,
    className = "",
    fallback = "",
    aspectRatio,
    // Variantes responsivas (srcset) — URLs já totalmente qualificadas
    avifSrcset,
    webpSrcset,
    imgSrcset,
    // Fontes únicas (imagens antigas/intermediárias sem srcset) — URLs qualificadas
    avifSrc,
    webpSrc,
    // Atributo `sizes` para escolha do navegador (breakpoints do grid)
    sizesAttr,
    ...rest
}) {
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
    const hasSrcset = !!(avifSrcset || webpSrcset || imgSrcset)

    const showAvifSource = avifSrcset || avifSrc
    const avifSourceSet = avifSrcset || avifSrc
    const showWebpSource = webpSrcset || (webpSrc && !showAvifSource)

    return (
        <picture>
            {showAvifSource && (
                <source type="image/avif" srcSet={avifSourceSet} sizes={avifSrcset ? sizesAttr : undefined} />
            )}
            {showWebpSource && (
                <source type="image/webp" srcSet={webpSrcset || webpSrc} sizes={webpSrcset ? sizesAttr : undefined} />
            )}
            <img
                src={currentSrc}
                srcSet={hasSrcset ? (imgSrcset || src) : undefined}
                sizes={hasSrcset ? sizesAttr : undefined}
                alt={alt}
                loading="lazy"
                decoding="async"
                className={`${className}${isSmall ? " is-small" : ""}`}
                style={ratio ? { aspectRatio: String(ratio), width: "100%", height: "auto" } : undefined}
                onLoad={handleLoad}
                onError={handleError}
                {...rest}
            />
        </picture>
    )
}