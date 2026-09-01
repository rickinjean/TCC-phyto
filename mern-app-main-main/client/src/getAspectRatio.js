export default function getAspectRatio(imagesMeta, path) {
    const meta = (Array.isArray(imagesMeta) ? imagesMeta : [])
        .find(m => m && m.path === path && m.width > 0 && m.height > 0)
    if (!meta) return null
    return meta.width / meta.height
}