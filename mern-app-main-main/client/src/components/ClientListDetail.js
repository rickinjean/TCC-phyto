import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import usePageTitle from "../usePageTitle"
import PlantCard from "./PlantCard"

export default function ClientListDetail() {
    usePageTitle("Lista")
    const { id } = useParams()
    const [lista, setLista] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch(`${API_URL}/userlists/${id}/plants`)
                if (!res) {
                    setError("Sessão expirada. Faça login novamente.")
                    return
                }
                if (!res.ok) {
                    setError(`Erro ao carregar a lista: ${res.status}`)
                    return
                }
                const data = await res.json()
                setLista(data.lista)
                setItems(data.plants)
            } catch {
                setError("Erro ao conectar com o servidor")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    async function removerPlanta(itemId, plantName) {
        if (!window.confirm(`Remover "${plantName}" desta lista?`)) return
        try {
            const res = await authFetch(`${API_URL}/userlists/${id}/plants/${itemId}`, { method: "DELETE" })
            if (!res) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }
            if (!res.ok) {
                setError("Erro ao remover a planta da lista.")
                return
            }
            setItems(prev => prev.filter(it => it.plantId !== itemId))
        } catch {
            setError("Erro ao conectar com o servidor")
        }
    }

    return (
        <div className="plant-list-page container mt-4">
            <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <h3 className="plant-list-page__title mb-0 fw-semibold">
                        {lista ? lista.name : "Lista"}
                    </h3>
                    {!loading && (
                        <span className="plant-list-page__count">
                            {items.length} {items.length === 1 ? "planta" : "plantas"}
                        </span>
                    )}
                </div>
                <Link to="/minhas-listas" className="btn btn-sm btn-outline-success">
                    Voltar às listas
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando lista...
                </div>
            ) : error ? (
                <div className="alert alert-danger mx-2">{error}</div>
            ) : items.length === 0 ? (
                <div className="favorites-page-empty col-12">
                    <div className="favorites-page-empty__icon">🌱</div>
                    <p className="favorites-page-empty__text">
                        Esta lista ainda está vazia.
                    </p>
                    <Link to="/plantlist" className="favorites-page-empty__link">
                        Explorar o catálogo
                    </Link>
                </div>
            ) : (
                <div className="row">
                    {items.map(item => (
                        <PlantCard
                            key={String(item._id)}
                            record={item.plant}
                            carousel={false}
                            onRemove={removerPlanta}
                            removeId={item.plantId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}