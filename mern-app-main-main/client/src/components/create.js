import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'; // IP do Servidor

export default function Create() {
    const [form, setForm] = useState({
        name: "",
        user: "",
        email: "",
        function: ""
    })
    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function onSubmit(e) {
        e.preventDefault()

        const newPerson = { ...form }
        const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/user/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newPerson)
        })

        if (!response.ok) {
            const message = `An error occurred: ${response.statusText}`
            window.alert(message)
            return
        }

        setForm({ name: "", user: "", email: "", function: "" })
        navigate("/")
    }

    return (
        <div>
            <h3>Cadastrar novo usuário</h3>
            <form onSubmit={onSubmit}>
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
                        type="text"
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
                            id="positionEstudante"
                            value="Estudante"
                            checked={form.function === "Estudante"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionEstudante" className="form-check-label">Estudante</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="positionOptions"
                            id="positionDocente"
                            value="Docente"
                            checked={form.function === "Docente"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionDocente" className="form-check-label">Docente</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="positionOptions"
                            id="positionTae"
                            value="Tae"
                            checked={form.function === "Tae"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionTae" className="form-check-label">Técnico Administrativo</label>
                    </div>
                </div>
                <div className="form-group">
                    <input
                        type="submit"
                        value="Enviar dados"
                        className="btn btn-primary"
                    />
                </div>
            </form>
        </div>
    )
}