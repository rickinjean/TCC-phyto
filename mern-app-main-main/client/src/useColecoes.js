import { useCallback, useEffect, useState } from "react"
import API_URL from "./config"
import authFetch from "./authFetch"

// Carrega as coleções do usuário + a matriz de associação planta↔coleção
// (GET /userlists/membership) e expõe helpers derivados.
// `refreshKey` re-dispara o fetch quando muda (ex.: abrir/fechar o picker).
export default function useColecoes({ plantaId, refreshKey, ativo = true } = {}) {
    const [listasMeta, setListasMeta] = useState([])
    const [membership, setMembership] = useState({})

    useEffect(() => {
        if (!ativo) return
        let cancelled = false
        async function load() {
            try {
                const res = await authFetch(`${API_URL}/userlists/membership`)
                if (!cancelled && res && res.ok) {
                    const data = await res.json()
                    setListasMeta(data.lists || [])
                    setMembership(data.membership || {})
                }
            } catch { /* silencioso */ }
        }
        load()
        return () => { cancelled = true }
    }, [ativo, refreshKey, plantaId])

    const listasDe = useCallback((idStr) => {
        const ids = membership[String(idStr)] || []
        return ids.map(li => listasMeta.find(l => String(l._id) === li)).filter(Boolean)
    }, [membership, listasMeta])

    const nomesDe = useCallback((idStr) => {
        return listasDe(idStr).map(l => l.name).filter(Boolean)
    }, [listasDe])

    const corDaPlanta = useCallback((idStr) => {
        const listas = listasDe(idStr)
        return listas.length ? listas[0].color : null
    }, [listasDe])

    const qtdDe = useCallback((idStr) => listasDe(idStr).length, [listasDe])

    const textoDe = useCallback((idStr) => {
        const listas = listasDe(idStr)
        const qtd = listas.length
        if (qtd > 1) return `Em ${qtd} coleções: ${listas.map(l => l.name).filter(Boolean).join(", ")}`
        if (qtd === 1) return "Em uma coleção — tocar para gerenciar"
        return "Adicionar a uma coleção"
    }, [listasDe])

    return { listasMeta, membership, listasDe, nomesDe, corDaPlanta, qtdDe, textoDe }
}