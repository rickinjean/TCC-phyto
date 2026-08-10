import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'; // IP do Servidor

// Card de uma planta na seção "Em Destaque"
const PlantCard = (props) => {
    return (
        <div className="col-sm-6 col-md-3">
            <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{props.plant.name}</h5>
                    <p className="card-subtitle text-muted fst-italic mb-3">
                        {props.plant.scientificName}
                    </p>
                    <Link
                        className="btn btn-outline-success mt-auto"
                        to={`/plantdetails/${props.plant._id}`}
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Botão de cada aba da seção "Em Destaque"
const TabButton = (props) => {
    return (
        <button
            type="button"
            className={`btn rounded-pill ${props.active ? "btn-success" : "btn-outline-success"}`}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    )
}

// Bloco numérico da seção "Estatísticas"
const StatBox = (props) => {
    return (
        <div className="col-6 col-md-3">
            <div className="bg-white bg-opacity-10 border border-light border-opacity-25 rounded-4 text-center py-4 h-100">
                <div className="fs-1 fw-bold">{props.value}</div>
                <div
                    className="text-white-50 text-uppercase small mt-1"
                    style={{ letterSpacing: 1 }}
                >
                    {props.label}
                </div>
            </div>
        </div>
    )
}

// Estação do ano (hemisfério sul — ajuste se o público-alvo for do hemisfério norte)
function getEstacaoAtual() {
    const mes = new Date().getMonth() // 0 = janeiro
    if (mes === 11 || mes === 0 || mes === 1) return "verão"
    if (mes >= 2 && mes <= 4) return "outono"
    if (mes >= 5 && mes <= 7) return "inverno"
    return "primavera"
}

const QUICK_ACCESS_CARDS = [
    {
        title: "Explorar Catálogo",
        text: "Navegue por nossa extensa coleção de plantas organizadas por categorias",
        href: "PlantList",
    },
    {
        title: "Dicas de Cuidado",
        text: "Aprenda como regar e adubar suas plantas para mantê-las saudáveis",
        href: "care.html",
    },
    {
        title: "Novas Adições",
        text: "Veja as plantas recém-cadastradas e descubra novidades da nossa coleção",
        href: "new.html",
    },
]

const TABS = [
    { key: "dia", label: "Planta do Dia" },
    { key: "pesquisadas", label: "Mais Pesquisadas" },
    { key: "recentes", label: "Recém Adicionadas" },
    { key: "estacao", label: "Plantas da Estação" },
]

export default function Home() {
    const [plants, setPlants] = useState([])
    const [users, setUsers] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("dia")
    const navigate = useNavigate()

    useEffect(() => {
        async function getPlants() {
            // ajuste a rota abaixo se o nome do recurso no backend for diferente de "plant"
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/`)

            if (!response.ok) {
                window.alert(`Um erro ocorreu: ${response.statusText}`)
                return
            }

            setPlants(await response.json())
        }

        async function getUsers() {
            const token = localStorage.getItem('token')
            if (!token) return
            const headers = { Authorization: `Bearer ${token}` }
            const response = await fetch(`${REACT_APP_YOUR_HOSTNAME}/user/`, { headers })
            if (!response.ok) return
            setUsers(await response.json())
        }

        getPlants()
        getUsers()
    }, [])

    function handleSearch(event) {
        event.preventDefault()
        const term = searchTerm.toLowerCase().trim()

        const matches = plants.filter(
            (plant) =>
                plant.name?.toLowerCase().includes(term) ||
                plant.scientificName?.toLowerCase().includes(term)
        )

        if (matches.length === 1) {
            // resultado único: vai direto para a página da planta
            navigate(`/plantdetails/${matches[0]._id}`)
        } else {
            // zero ou várias plantas encontradas: mostra a lista filtrada
            navigate(`/plantlist?search=${searchTerm}`)
        }
    }

    // ----- Filtros da seção "Plantas em Destaque" -----
    // As funções abaixo decidem o que aparece em cada aba. Algumas dependem
    // de campos que talvez ainda não existam no seu schema — os comentários
    // indicam o que confirmar/ajustar no backend.

    const indiceDoDia = plants.length > 0 ? new Date().getDate() % plants.length : -1

    function plantaDoDia() {
        return indiceDoDia === -1 ? [] : [plants[indiceDoDia]]
    }

    function maisPesquisadas() {
        // TODO: substituir por ordenação real quando existir contagem de pesquisas/visualizações.
        // Por enquanto só pula a "planta do dia" e mostra as duas próximas, pra não repetir.
        return plants.filter((_, indice) => indice !== indiceDoDia).slice(0, 2)
    }

    function recemAdicionadas() {
        // Supõe que o documento tem "createdAt" (Mongoose com timestamps: true).
        // Se não tiver, ajuste para ordenar por outro campo de data.
        return [...plants]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 2)
    }

    function plantasDaEstacao() {
        // Supõe que existe plant.cultivo.estacao (campo "Estação" da aba "Cultivo da Planta").
        // Ajuste o caminho do campo conforme o nome real no seu schema.
        const estacaoAtual = getEstacaoAtual()
        return plants.filter((plant) =>
            plant.cultivo?.estacao?.toLowerCase().includes(estacaoAtual)
        )
    }

    function plantasEmDestaque() {
        if (activeTab === "pesquisadas") return maisPesquisadas()
        if (activeTab === "recentes") return recemAdicionadas()
        if (activeTab === "estacao") return plantasDaEstacao()
        return plantaDoDia()
    }

    const destaque = plantasEmDestaque()

    return (
        <div>
            {/* ----- Hero + Busca ----- */}
            <div className="bg-light text-center py-5 px-3">
                <h1 className="fw-bold">Phytografia</h1>
                <h5 className="text-success mb-4">Sistema de Pesquisa Botânica</h5>

                <form onSubmit={handleSearch} className="d-flex justify-content-center">
                    <div className="input-group" style={{ maxWidth: 500 }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Pesquise por plantas, cores ou características..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                        <button type="submit" className="btn btn-success">
                            Buscar
                        </button>
                    </div>
                </form>
            </div>

            {/* ----- Cards de Acesso rápido ----- */}
            <div className="container py-4">
                <h3 className="text-center mb-4">Acesso Rápido</h3>
                <div className="row g-4">
                    {QUICK_ACCESS_CARDS.map((card, index) => (
                        <div key={index} className="col-12 col-md-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{card.title}</h5>
                                    <p className="card-text mb-4">{card.text}</p>
                                    <a href={card.href} className="btn btn-success mt-auto">
                                        Explorar
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ----- Plantas em Destaque ----- */}
            <div className="container py-5">
                <h3 className="text-center mb-4">Plantas em Destaque</h3>

                <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
                    {TABS.map((tab) => (
                        <TabButton
                            key={tab.key}
                            label={tab.label}
                            active={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                        />
                    ))}
                </div>

                <div className="row g-4">
                    {destaque.length > 0
                        ? destaque.map((plant) => <PlantCard key={plant._id} plant={plant} />)
                        : <p className="text-muted text-center">Nenhuma planta encontrada para esta categoria.</p>}
                </div>
            </div>

            {/* ----- Estatísticas ----- */}
            <div className="bg-dark text-white py-5">
                <div className="container">
                    <h3 className="text-center mb-5">Estatísticas do Sistema</h3>
                    <div className="row g-3">
                        <StatBox value={plants.length} label="Plantas Cadastradas" />
                        <StatBox value={users.length} label="Usuários Cadastrados" />
                        {/* TODO: substituir quando houver rastreamento real de pesquisas */}
                        <StatBox value="—" label="Pesquisas Hoje" />
                    </div>
                </div>
            </div>
        </div>
    )
}