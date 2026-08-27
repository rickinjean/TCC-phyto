import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API_URL from "../config"

export default function Edit() {
    const [form, setForm] = useState({
        name: "",
        user: "",
        email: "",
        function: ""
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const params = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() {
            try {
                const id = params.id
                const token = localStorage.getItem('token')
                const headers = token ? { Authorization: `Bearer ${token}` } : {}
                const response = await fetch(`${API_URL}/user/${id}`, { headers })
                if (!response.ok) {
                    setError(`Erro: ${response.statusText}`)
                    return
                }

                const user = await response.json()
                if (!user) {
                    setError(`Usuário com id ${id} não encontrado`)
                    return
                }

                setForm(user)
            } catch {
                setError("Erro ao conectar com o servidor")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [params.id])

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function onSubmit(e) {
        e.preventDefault()
        setError("")

        const editedPerson = { ...form }
        const token = localStorage.getItem('token')
        const headers = {
            "Content-Type": "application/json"
        }
        if (token) headers.Authorization = `Bearer ${token}`

        try {
            const response = await fetch(`${API_URL}/update/${params.id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(editedPerson)
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.message || `Erro: ${response.statusText}`)
                return
            }

            navigate("/")
        } catch {
            setError("Erro ao conectar com o servidor")
        }
    }

    if (loading) {
        return (
            <div className="admin-page admin-page--form">
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando dados do usuário...
                </div>
            </div>
        )
    }

    return (
        <div className="admin-page admin-page--form">
            <h3 className="admin-page__title">Alteração de dados</h3>
            {error && (
                <div className="alert alert-danger py-2">{error}</div>
            )}
            <form className="admin-form" onSubmit={onSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Nome</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={form.name}
                        onChange={(e) => updateForm({ name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="user">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        id="user"
                        value={form.user}
                        onChange={(e) => updateForm({ user: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">E-mail</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={form.email}
                        onChange={(e) => updateForm({ email: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="positionOptions"
                            id="positionUsuario"
                            value="User"
                            checked={form.function === "User"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionUsuario" className="form-check-label">Usuário</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="positionOptions"
                            id="positionADM"
                            value="ADM"
                            checked={form.function === "ADM"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionADM" className="form-check-label">ADM</label>
                    </div>
                </div>
                <div className="form-group">
                    <input
                        type="submit"
                        value="Salvar"
                        className="btn btn-primary"
                    />
                </div>
            </form>
        </div>
    )
}