import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"

export default function Create() {
    const [form, setForm] = useState({
        name: "",
        user: "",
        email: "",
        function: "",
        senha: ""
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function onSubmit(e) {
        e.preventDefault()
        setError("")
        setLoading(true)

        const newPerson = { ...form }

        try {
            const response = await authFetch(`${API_URL}/user/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPerson)
            })

            if (response === null) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.message || `Erro: ${response.statusText}`)
                return
            }

            setForm({ name: "", user: "", email: "", function: "", senha: "" })
            navigate("/")
        } catch {
            setError("Erro ao conectar com o servidor")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="admin-page admin-page--form">
            <h3 className="admin-page__title">Cadastrar novo usuário</h3>
            <form className="admin-form" onSubmit={onSubmit}>
                {error && (
                    <div className="alert alert-danger py-2">{error}</div>
                )}
                <div className="form-group">
                    <label htmlFor="name">Nome completo</label>
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
                    <label htmlFor="senha">Senha</label>
                    <input
                        type="password"
                        className="form-control"
                        id="senha"
                        value={form.senha}
                        onChange={(e) => updateForm({ senha: e.target.value })}
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
                        value={loading ? "Cadastrando..." : "Enviar dados"}
                        className="btn btn-primary"
                        disabled={loading}
                    />
                </div>
            </form>
        </div>
    )
}