import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'; // IP do Servidor

export default function Edit() {
    const [form, setForm] = useState({
        name: "",
        user: "",
        email: "",
        function: ""
    })
    const params = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() {
            const id = params.id
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/user/${id}`)
            if (!response.ok) {
                const message = `An error occurred: ${response.statusText}`
                window.alert(message)
                return
            }

            const user = await response.json()
            if (!user) {
                window.alert(`Usuário com id ${id} não encontrado`)
                navigate("/")
                return
            }

            setForm(user)
        }

        fetchData()

        return
    }, [params.id, navigate])

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function onSubmit(e) {
        e.preventDefault()

        const editedPerson = { ...form }
        const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/update/${params.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(editedPerson)
        })

        if (!response.ok) {
            const message = `An error occurred: ${response.statusText}`
            window.alert(message)
            return
        }

        navigate("/")
    }

    return (
        <div>
            <h3>Alteração de dados</h3>
            <form onSubmit={onSubmit}>
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
                        value="Salvar"
                        className="btn btn-primary"
                    />
                </div>
            </form>
        </div>
    )
}