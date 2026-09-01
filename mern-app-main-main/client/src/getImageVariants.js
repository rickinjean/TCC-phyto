// Extrai as variantes de uma imagem a partir de imagesMeta.
// imagesMeta pode ter:
//   - formato novo com sizes ({avifPath, webpPath, path, width, height, sizes:{400:{avif,webp},800:{...}}})
//   - formato intermediário ({avifPath, webpPath, path, width, height})
//   - formato antigo ({path, width, height})
// Retorna null quando não encontra a imagem.
//
// Monta strings prontas para srcset, prefixando as URLs com `base` (ex.: API_URL).
// Imagens sem variants (antigas) caem no fallback de fonte única.

function toSrcset(entries, base) {
    return entries
        .map(([w, url]) => `${base}${url} ${w}w`)
        .join(", ")
}

export default function getImageVariants(imagesMeta, path, base = "") {
    if (!path) return null
    const meta = (Array.isArray(imagesMeta) ? imagesMeta : []).find(m => m && (
        m.path === path || m.webpPath === path || m.avifPath === path
    ))
    if (!meta) return null

    const aspectRatio = meta.width > 0 && meta.height > 0 ? meta.width / meta.height : null

    const sizesObj = (meta.sizes && typeof meta.sizes === "object") ? meta.sizes : null
    let avifSrcset = null
    let webpSrcset = null
    if (sizesObj) {
        const build = fmt => Object.keys(sizesObj)
            .map(Number)
            .filter(w => Number.isFinite(w) && sizesObj[w]?.[fmt])
            .sort((a, b) => a - b)
            .map(w => [w, sizesObj[w][fmt]])
        const avif = build("avif")
        const webp = build("webp")
        if (avif.length) avifSrcset = toSrcset(avif, base)
        if (webp.length) webpSrcset = toSrcset(webp, base)
    }

    return {
        aspectRatio,
        avifSrc: meta.avifPath ? `${base}${meta.avifPath}` : null,
        webpSrc: meta.webpPath ? `${base}${meta.webpPath}` : null,
        // srcset para <source type="image/avif"> e <source type="image/webp">
        avifSrcset,
        webpSrcset,
        // fallback <img>: WebP se disponível, senão a fonte original
        imgSrcset: webpSrcset || avifSrcset || null,
        imgSrc: meta.path || meta.webpPath || meta.avifPath ? `${base}${meta.path || meta.webpPath || meta.avifPath}` : null,
    }
}