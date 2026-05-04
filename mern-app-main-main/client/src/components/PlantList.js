import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'

const Record = (props) => {
    return (
        <tr>
            <td>{props.record.name}</td>
            <td>{props.record.scientificName}</td>
            <td>{props.record.simpleDescription}</td>
            <td>
                <Link
                    className="btn btn-link"
                    to={`/editplant/${props.record._id}`}
                >
                    Editar
                </Link>
                <Link
                    className="btn btn-link"
                    to={`/plantdetails/${props.record._id}`}
                >
                    Detalhes
                </Link>
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

export default function PlantList() {
    const [plants, setplants] = useState([])

    useEffect(() => {
        async function getplants() {
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/`)

            if (!response.ok) {
                const message = `Um erro ocorreu: ${response.statusText}`
                window.alert(message)
                return
            }

            const plants = await response.json()
            setplants(plants)
        }

        getplants()

        return
    }, [])

    async function deleteRecord(id) {
        const result = window.confirm("Deseja remover desta lista?")

        if (!result) {
            return
        }

        await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/${id}`, {
            method: "DELETE"
        })

        const newplants = plants.filter((record) => record._id !== id)
        setplants(newplants)
    }

    function recordList() {
        return plants.map((record) => {
            return (
                <Record
                    key={record._id}
                    record={record}
                    deleteRecord={deleteRecord}
                />
            )
        })
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Lista de Plantas</h3>
            </div>

            <div className="table-responsive">
                <table
                    className="table table-striped table-bordered"
                    style={{ marginTop: 20 }}
                >
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Nome Científico</th>
                            <th>Descrição Simples</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>{recordList()}</tbody>
                </table>
            </div>
        </div>
    )
}