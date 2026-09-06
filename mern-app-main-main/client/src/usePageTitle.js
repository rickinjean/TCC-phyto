import { useEffect } from "react"

const DEFAULT_DESCRIPTION = "Phytografia é um sistema de pesquisa botânica desenvolvido como trabalho de conclusão de curso do IFC Campus Sombrio. Consulte informações sobre plantas medicinais, fitoterapia e biodiversidade."

export default function usePageTitle(title, description) {
    useEffect(() => {
        const previous = document.title
        const meta = document.querySelector('meta[name="description"]')
        const previousDescription = meta ? meta.getAttribute("content") : null

        document.title = title ? `${title} — Phytografia` : "Phytografia — Sistema de Pesquisa Botânica"

        if (meta) {
            meta.setAttribute("content", description || DEFAULT_DESCRIPTION)
        }

        return () => {
            document.title = previous
            if (meta && previousDescription != null) {
                meta.setAttribute("content", previousDescription)
            }
        }
    }, [title, description])
}