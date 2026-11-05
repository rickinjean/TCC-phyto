import React from "react"
import { Link } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import useAuthFetchData from "../useAuthFetchData"

const Record = (props) => {
    return (
        <tr>
            <td data-label="Nome">{props.record.name}</td>
            <td data-label="Login">{props.record.user}</td>
            <td data-label="E-mail">{props.record.email || "—"}</td>
            <td data-label="Função"><span className={`user-role-badge ${props.record.function === "ADM" ? "is-admin" : ""}`}>{props.record.function === "ADM" ? "Administrador" : "Usuário"}</span></td>
            <td data-label="Ações" className="admin-table__actions">
                <Link className="btn btn-link user-row-actions__edit" to={`/edit/${props.record._id}`}>Editar</Link>
                <button
                    className="btn btn-link user-row-actions__delete"
                    type="button"
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
    const { data: users = [], setData: setUsers, loading, error, setError } = useAuthFetchData(`${API_URL}/user/`, [], "Erro ao carregar usuários")

    async function deleteRecord(id) {
        const result = window.confirm("Deseja remover desta lista?")
        if (!result) {
            return
        }

        const res = await authFetch(`${API_URL}/user/${id}`, {
            method: "DELETE"
        })
        if (res === null) {
            setError("Sessão expirada. Faça login novamente.")
            return
        }

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
            <header className="workspace-page__header">
                <div>
                    <p className="workspace-page__eyebrow">Administração · Acessos</p>
                    <h1 className="workspace-page__title">Lista de usuários</h1>
                    <p className="workspace-page__description">Consulte e administre as contas cadastradas no sistema.</p>
                </div>
                {!loading && !error && (
                    <span className="workspace-page__metric">
                        <strong>{users.length}</strong>
                        {users.length === 1 ? "usuário" : "usuários"}
                    </span>
                )}
            </header>
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
                            <th>Nome</th>
                            <th>Login</th>
                            <th>E-mail</th>
                            <th>Função</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>{recordList()}</tbody>
                </table>
                </div>
            )}
        </div>
    )
}
