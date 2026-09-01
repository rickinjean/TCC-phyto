import { useEffect } from "react"

export default function usePageTitle(title) {
    useEffect(() => {
        const previous = document.title
        document.title = title ? `${title} — Phytografia` : "Phytografia — Sistema de Pesquisa Botânica"
        return () => {
            document.title = previous
        }
    }, [title])
}