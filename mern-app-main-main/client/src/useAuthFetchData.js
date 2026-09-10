import { useCallback, useEffect, useRef, useState } from "react"
import authFetch from "./authFetch"

// GET autenticado + estados: { data, setData, loading, error, recarregar }.
// `deps` controla quando refazer a busca (ex.: mudança de id).
// `msgErro` personaliza a mensagem quando a resposta não é ok.
export default function useAuthFetchData(url, deps = [], msgErro = "Erro ao carregar os dados") {
    const urlRef = useRef(url)
    useEffect(() => { urlRef.current = url }, [url])

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [tentativa, setTentativa] = useState(0)

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            try {
                const res = await authFetch(urlRef.current)
                if (cancelled) return
                if (!res) {
                    setError("Sessão expirada. Faça login novamente.")
                    return
                }
                if (!res.ok) {
                    setError(`${msgErro}: ${res.status}`)
                    return
                }
                setData(await res.json())
                setError(null)
            } catch {
                if (!cancelled) setError("Erro ao conectar com o servidor")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tentativa, ...deps, msgErro])

    const recarregar = useCallback(() => setTentativa(t => t + 1), [])

    return { data, setData, loading, error, setError, recarregar }
}