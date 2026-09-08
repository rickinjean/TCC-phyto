import { useEffect } from "react"

const SITE_URL = "https://tcc-phyto.onrender.com"
const DEFAULT_TITLE = "Phytografia — Sistema de Pesquisa Botânica"
const DEFAULT_DESCRIPTION = "Phytografia é um sistema de pesquisa botânica desenvolvido como trabalho de conclusão de curso do IFC Campus Sombrio. Consulte informações sobre biodiversidade em um catálogo digital interativo."

function getMeta(property) {
    return document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`)
}

export default function usePageTitle(title, description, path) {
    useEffect(() => {
        const previous = document.title
        const meta = document.querySelector('meta[name="description"]')
        const previousDescription = meta ? meta.getAttribute("content") : null
        const canonical = document.querySelector('link[rel="canonical"]')
        const previousCanonical = canonical ? canonical.getAttribute("href") : null
        const ogTitle = getMeta("og:title")
        const previousOgTitle = ogTitle ? ogTitle.getAttribute("content") : null
        const ogDesc = getMeta("og:description")
        const previousOgDesc = ogDesc ? ogDesc.getAttribute("content") : null
        const ogUrl = getMeta("og:url")
        const previousOgUrl = ogUrl ? ogUrl.getAttribute("content") : null
        const twTitle = getMeta("twitter:title")
        const previousTwTitle = twTitle ? twTitle.getAttribute("content") : null
        const twDesc = getMeta("twitter:description")
        const previousTwDesc = twDesc ? twDesc.getAttribute("content") : null

        const pageTitle = title ? `${title} — Phytografia` : DEFAULT_TITLE
        const pageDescription = description || DEFAULT_DESCRIPTION
        const pageUrl = path ? `${SITE_URL}${path}` : SITE_URL

        document.title = pageTitle

        if (meta) {
            meta.setAttribute("content", pageDescription)
        }

        if (canonical) {
            canonical.setAttribute("href", pageUrl)
        }

        if (ogTitle) ogTitle.setAttribute("content", pageTitle)
        if (ogDesc) ogDesc.setAttribute("content", pageDescription)
        if (ogUrl) ogUrl.setAttribute("content", pageUrl)
        if (twTitle) twTitle.setAttribute("content", pageTitle)
        if (twDesc) twDesc.setAttribute("content", pageDescription)

        return () => {
            document.title = previous
            if (meta && previousDescription != null) {
                meta.setAttribute("content", previousDescription)
            }
            if (canonical && previousCanonical != null) {
                canonical.setAttribute("href", previousCanonical)
            }
            if (ogTitle && previousOgTitle != null) ogTitle.setAttribute("content", previousOgTitle)
            if (ogDesc && previousOgDesc != null) ogDesc.setAttribute("content", previousOgDesc)
            if (ogUrl && previousOgUrl != null) ogUrl.setAttribute("content", previousOgUrl)
            if (twTitle && previousTwTitle != null) twTitle.setAttribute("content", previousTwTitle)
            if (twDesc && previousTwDesc != null) twDesc.setAttribute("content", previousTwDesc)
        }
    }, [title, description, path])
}
