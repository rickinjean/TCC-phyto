// Extrai as variantes de uma imagem a partir de imagesMeta.
// imagesMeta pode ser o formato novo ({avifPath, webpPath, path, width, height})
// ou o antigo ({path, width, height}). Retorna null quando não encontra.
export default function getImageVariants(imagesMeta, path) {
    if (!path) return null
    const meta = (Array.isArray(imagesMeta) ? imagesMeta : []).find(m => m && (
        m.path === path || m.webpPath === path || m.avifPath === path
    ))
    if (!meta) return null
    const aspectRatio = meta.width > 0 && meta.height > 0 ? meta.width / meta.height : null
    return {
        aspectRatio,
        avifSrc: meta.avifPath || null,
        webpSrc: meta.webpPath || meta.path || null,
    }
}