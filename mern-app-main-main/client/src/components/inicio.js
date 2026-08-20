import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'; // IP do Servidor

// Card de uma planta na seção "Em Destaque"
const PlantCard = (props) => {
    const images = props.plant.imagesPath?.length > 0 ? props.plant.imagesPath : props.plant.imagePath ? [props.plant.imagePath] : []
    const imageUrl = images.length > 0 ? `${REACT_APP_YOUR_HOSTNAME}${images[0]}` : "https://via.placeholder.com/400x250/4a4a4a/7db3dd?text=🌿"

    return (
<div className="col-sm-6 col-md-3">
            <div className="plant-feature-card card h-100">
                <div className="plant-feature-card__image">
                    <img
                        src={imageUrl}
                        alt={props.plant.name}
                        className="plant-feature-card__img"
                    />
                </div>
<div className="card-body d-flex flex-column">
                    <h5 className="card-title plant-feature-card__title">{props.plant.name}</h5>
                    <p className="card-subtitle plant-feature-card__scientific fst-italic mb-3">
                        {props.plant.scientificName}
                    </p>
                    <Link
                        className="plant-feature-card__button mt-auto btn btn-primary rounded-pill btn-sm"
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
            className={`btn rounded-pill ${props.active ? 'btn-primary' : 'btn-outline-secondary'}`}
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
<div className="stat-card card text-center py-5 h-100">
                <div className="stat-card__value fs-1 fw-bold">{props.value}</div>
                <div className="stat-card__label text-uppercase small mt-3">
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
    const [searchesToday, setSearchesToday] = useState(0)
    const navigate = useNavigate()

    // Função para rastrear pesquisas
    function trackSearch() {
        const today = new Date().toDateString()
        const storageKey = `searches_${today}`
        const currentSearches = parseInt(localStorage.getItem(storageKey) || "0")
        localStorage.setItem(storageKey, String(currentSearches + 1))
        setSearchesToday(currentSearches + 1)
    }

    // Função para contar categorias únicas
    function getUniqueCategories() {
        const categories = new Set()
        plants.forEach(plant => {
            if (plant.category) categories.add(plant.category)
        })
        return categories.size
    }

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

        // Recuperar contagem de pesquisas de hoje
        const today = new Date().toDateString()
        const storageKey = `searches_${today}`
        const savedSearches = parseInt(localStorage.getItem(storageKey) || "0")
        setSearchesToday(savedSearches)

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
            trackSearch()
            navigate(`/plantdetails/${matches[0]._id}`)
        } else {
            // zero ou várias plantas encontradas: mostra a lista filtrada
            trackSearch()
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
        <div className="home-page">
            {/* ----- Hero + Busca ----- */}
            <section className="home-hero text-center px-3 py-5">
                <div className="container">
                    <h1 className="home-hero__title fw-bold">Phytografia</h1>
                    <h5 className="home-hero__subtitle mb-4">Sistema de Pesquisa Botânica</h5>

                    <form onSubmit={handleSearch} className="d-flex justify-content-center">
                        <div className="home-search input-group">
                            <input
                                type="text"
className="home-search__input form-control"
                                placeholder="Pesquise por plantas, cores ou características..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                
                            />
                            <button type="submit" className="btn btn-primary">
                                Buscar
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* ----- Cards de Acesso rápido ----- */}
            <section className="home-section home-section--quick px-3">
                <div className="container">
                    <h3 className="home-section__title text-center mb-5">Acesso Rápido</h3>
                    <div className="row g-4">
                        {QUICK_ACCESS_CARDS.map((card, index) => (
                            <div key={index} className="col-12 col-md-4">
                                <div className="quick-card card h-100 shadow-sm">
                                    <div className="card-body d-flex flex-column">
<h5 className="quick-card__title card-title">{card.title}</h5>
                                        <p className="quick-card__text card-text mb-4">{card.text}</p>
                                        <a href={card.href} className="quick-card__button btn btn-primary mt-auto">
                                            Explorar
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ----- Plantas em Destaque ----- */}
            <section className="home-section home-section--featured px-3">
                <div className="container">
                    <h3 className="home-section__title text-center mb-5">Plantas em Destaque</h3>

                    <div className="d-flex justify-content-center gap-2 mb-5 flex-wrap">
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
                            : <p className="home-empty text-center">Nenhuma planta encontrada para esta categoria.</p>}
                    </div>
                </div>
            </section>

            {/* ----- Estatísticas ----- */}
            <section className="home-section home-section--stats px-3">
                <div className="container">
                    <h3 className="home-section__title text-center mb-5">Estatísticas do Sistema</h3>
                    <div className="row g-3">
                        <StatBox value={plants.length} label="Plantas Cadastradas" />
                        <StatBox value={users.length} label="Usuários Cadastrados" />
                        <StatBox value={getUniqueCategories()} label="Categorias" />
                        <StatBox value={searchesToday} label="Pesquisas Hoje" />
                    </div>
                </div>
            </section>
        </div>
    )
}