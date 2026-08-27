import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"

const Record = (props) => {
    return (
        <tr>
            <td>{props.record.name}</td>
            <td>{props.record.user}</td>
            <td>{props.record.email}</td>
            <td>{props.record.function}</td>
            <td>
                <Link className="btn btn-link" to={`/edit/${props.record._id}`}>Editar</Link> |
                <button
                    className="btn btn-link"
                    onClick={() => {
                        props.deleteRecord(props.record._id)
                    }}
                >
                    Excluir
                </button>
            </td>
        </tr>
    )
}

export default function UserList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function getUsers() {
            try {
                const token = localStorage.getItem('token')
                const headers = token ? { Authorization: `Bearer ${token}` } : {}
                const response = await fetch(`${API_URL}/user/`, { headers })

                if (!response.ok) {
                    setError(`Erro ao carregar usuários: ${response.statusText}`)
                    return
                }

                const users = await response.json()
                setUsers(users)
            } catch {
                setError("Erro ao conectar com o servidor")
            } finally {
                setLoading(false)
            }
        }

        getUsers()
    }, [])

    async function deleteRecord(id) {
        const result = window.confirm("Deseja remover desta lista?")
        if (!result) {
            return
        }

        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        await fetch(`${API_URL}/user/${id}`, {
            method: "DELETE",
            headers
        })

        const newUsers = users.filter((record) => record._id !== id)
        setUsers(newUsers)
    }

    function recordList() {
        return users.map((record) => {
            return (
                <Record
                    key={record._id}
                    record={record}
                    deleteRecord={() => deleteRecord(record._id)}
                />
            )
        })
    }

    return (
        <div className="admin-page admin-page--users">
            <h3 className="admin-page__title ps-2">Lista de Usuários</h3>
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Carregando usuários...
                </div>
            ) : error ? (
                <div className="alert alert-danger mx-2">{error}</div>
            ) : (
                <div className="admin-table-wrap">
                <table className="admin-table table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Login</th>
                            <th>E-mail</th>
                            <th>Função</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>{recordList()}</tbody>
                </table>
                </div>
            )}
        </div>
    )
}
