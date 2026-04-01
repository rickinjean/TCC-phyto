import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'; // IP do Servidor

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

    useEffect(() => {
        async function getUsers() {
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/user/`)

            if (!response.ok) {
                const message = `Um erro ocorreu: ${response.statusText}`
                window.alert(message)
                return
            }

            const users = await response.json()
            setUsers(users)
        }

        getUsers()

        return
    }, [users.length])

    async function deleteRecord(id) {
        const result = window.confirm("Deseja remover desta lista?")
        if (!result) {
            return
        }

        await fetch(`${REACT_APP_YOUR_HOSTNAME}/${id}`, {
            method: "DELETE"
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
        <div>
            <h3 className="ps-2">Lista de Usuários</h3>
            <table className="table table-striped" style={{ marginTop: 20 }}>
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
    )
}
