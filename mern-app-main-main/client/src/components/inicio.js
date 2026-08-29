import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import API_URL from "../config"
import { encodeId } from "../idCodec"

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' fill='%23dceee3'%3E%3Crect width='400' height='250'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%232f8a5d'%3E%F0%9F%8C%BF%3C/text%3E%3Ctext x='50%25' y='62%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2371827a'%3ESem imagem%3C/text%3E%3C/svg%3E"

function objectIdToTimestamp(id) {
    try {
        return typeof id === "string" ? parseInt(id.substring(0, 8), 16) * 1000 : 0
    } catch {
        return 0
    }
}

function getPlantImageUrl(plant) {
    const images = plant.imagesPath?.length > 0 ? plant.imagesPath : plant.imagePath ? [plant.imagePath] : []
    return images.length > 0 ? `${API_URL}${images[0]}` : PLACEHOLDER_IMG
}

const PlantCard = ({ plant }) => {
    return (
        <div className="col-sm-6 col-md-3">
            <div className="plant-feature-card card h-100">
                <div className="plant-feature-card__image">
                    <img
                        src={getPlantImageUrl(plant)}
                        alt={plant.name}
                        className="plant-feature-card__img"
                        onError={(e) => { e.target.src = PLACEHOLDER_IMG }}
                    />
                </div>
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title plant-feature-card__title">{plant.name}</h5>
                    <p className="card-subtitle plant-feature-card__scientific fst-italic mb-3">
                        {plant.scientificName}
                    </p>
                    <Link
                        className="plant-feature-card__button mt-auto btn btn-primary rounded-pill btn-sm"
                        to={`/plantdetails/${encodeId(plant._id)}`}
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    )
}

const TabButton = ({ label, active, onClick }) => (
    <button
        type="button"
        className={`btn rounded-pill ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={onClick}
    >
        {label}
    </button>
)

const StatBox = ({ value, label, loading }) => (
    <div className="col-6 col-md-3">
        <div className="stat-card card text-center py-5 h-100">
            <div className="stat-card__value fs-1 fw-bold">
                {loading ? <span className="spinner-border spinner-border-sm" /> : value}
            </div>
            <div className="stat-card__label text-uppercase small mt-3">
                {label}
            </div>
        </div>
    </div>
)

function getEstacaoAtual() {
    const mes = new Date().getMonth()
    if (mes === 11 || mes === 0 || mes === 1) return "verão"
    if (mes >= 2 && mes <= 4) return "outono"
    if (mes >= 5 && mes <= 7) return "inverno"
    return "primavera"
}

const QUICK_ACCESS_CARDS = [
    {
        title: "Explorar Catálogo",
        text: "Navegue pela coleção de plantas com filtros por cor, luz, solo e mais",
        href: "/plantlist",
        icon: "🔍",
    },
    {
        title: "Favoritos",
        text: "Acesse suas plantas favoritas salvas para consulta rápida",
        href: "/favoritos",
        icon: "💚",
    },
    {
        title: "Sobre o Projeto",
        text: "Conheça a equipe, a missão e os recursos do Phytografia",
        href: "/Sobre",
        icon: "📖",
    },
]

const TABS = [
    { key: "dia", label: "Planta do Dia" },
    { key: "destaque", label: "Em Destaque" },
    { key: "recentes", label: "Recém Adicionadas" },
    { key: "estacao", label: "Plantas da Estação" },
]

export default function Home() {
    const [plants, setPlants] = useState([])
    const [stats, setStats] = useState({ plantCount: 0, userCount: 0 })
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("dia")
    const [loadingPlants, setLoadingPlants] = useState(true)
    const [loadingStats, setLoadingStats] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        async function loadData() {
            setLoadingPlants(true)
            setLoadingStats(true)

            const plantsPromise = fetch(`${API_URL}/plant/`)
                .then(r => r.ok ? r.json() : [])
                .catch(() => [])

            const statsPromise = fetch(`${API_URL}/stats`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)

            const [plantsData, statsData] = await Promise.all([plantsPromise, statsPromise])

            setPlants(plantsData)
            setLoadingPlants(false)

            if (statsData) {
                setStats(statsData)
            }
            setLoadingStats(false)
        }
        loadData()
    }, [])

    function handleSearch(event) {
        event.preventDefault()
        const term = searchTerm.toLowerCase().trim()
        if (!term) return

        const matches = plants.filter(
            (p) =>
                p.name?.toLowerCase().includes(term) ||
                p.scientificName?.toLowerCase().includes(term)
        )

        if (matches.length === 1) {
            navigate(`/plantdetails/${encodeId(matches[0]._id)}`)
        } else {
            navigate(`/plantlist?search=${encodeURIComponent(searchTerm)}`)
        }
    }

    const indiceDoDia = useMemo(() => {
        if (plants.length === 0) return -1
        const today = new Date()
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
        return seed % plants.length
    }, [plants])

    const plantaDoDia = useCallback(() => {
        return indiceDoDia === -1 ? [] : [plants[indiceDoDia]]
    }, [plants, indiceDoDia])

    const emDestaque = useCallback(() => {
        const withoutDay = plants.filter((_, i) => i !== indiceDoDia)
        const shuffled = [...withoutDay].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, 4)
    }, [plants, indiceDoDia])

    const recemAdicionadas = useCallback(() => {
        return [...plants]
            .sort((a, b) => objectIdToTimestamp(b._id) - objectIdToTimestamp(a._id))
            .slice(0, 4)
    }, [plants])

    const plantasDaEstacao = useCallback(() => {
        const estacaoAtual = getEstacaoAtual()
        return plants.filter((p) => {
            const stationName = (p.stationData?.name || p.station || "").toLowerCase()
            return stationName.includes(estacaoAtual)
        }).slice(0, 4)
    }, [plants])

    const destaque = useMemo(() => {
        if (activeTab === "dia") return plantaDoDia()
        if (activeTab === "destaque") return emDestaque()
        if (activeTab === "recentes") return recemAdicionadas()
        if (activeTab === "estacao") return plantasDaEstacao()
        return plantaDoDia()
    }, [activeTab, plantaDoDia, emDestaque, recemAdicionadas, plantasDaEstacao])

    return (
        <div className="home-page">
            {/* ── Hero + Busca ── */}
            <section className="home-hero text-center px-3 py-5">
                <div className="container">
                    <h1 className="home-hero__title fw-bold">Phytografia</h1>
                    <h5 className="home-hero__subtitle mb-4">Sistema de Pesquisa Botânica</h5>

                    <form onSubmit={handleSearch} className="d-flex justify-content-center">
                        <div className="home-search input-group">
                            <input
                                type="text"
                                className="home-search__input form-control"
                                placeholder="Pesquise por nome comum ou científico..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">
                                Buscar
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* ── Cards de Acesso Rápido ── */}
            <section className="home-section home-section--quick px-3">
                <div className="container">
                    <h3 className="home-section__title text-center mb-5">Acesso Rápido</h3>
                    <div className="row g-4">
                        {QUICK_ACCESS_CARDS.map((card, index) => {
                            return (
                                <div key={index} className="col-12 col-md-4">
                                    <div className="quick-card card h-100 shadow-sm">
                                        <div className="card-body d-flex flex-column">
                                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{card.icon}</div>
                                            <h5 className="quick-card__title card-title">{card.title}</h5>
                                            <p className="quick-card__text card-text mb-4">{card.text}</p>
                                            <Link to={card.href} className="quick-card__button btn btn-primary mt-auto">
                                                Explorar
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── Plantas em Destaque ── */}
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
                        {loadingPlants ? (
                            <div className="col-12 text-center py-5">
                                <div className="spinner-border spinner-border-sm me-2" role="status" />
                                Carregando plantas...
                            </div>
                        ) : destaque.length > 0 ? (
                            destaque.map((plant) => <PlantCard key={plant._id} plant={plant} />)
                        ) : (
                            <p className="home-empty text-center">Nenhuma planta encontrada para esta categoria.</p>
                        )}
                    </div>

                    <div className="text-center mt-4">
                        <Link className="home-featured__all btn btn-primary rounded-pill" to="/plantlist">
                            Ver todas as plantas
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Estatísticas ── */}
            <section className="home-section home-section--stats px-3">
                <div className="container">
                    <h3 className="home-section__title text-center mb-5">Estatísticas do Sistema</h3>
                    <div className="row g-3">
                        <StatBox value={stats.plantCount} label="Plantas Cadastradas" loading={loadingStats} />
                        <StatBox value={stats.userCount} label="Usuários Cadastrados" loading={loadingStats} />
                        <StatBox
                            value={plants.filter(p => p.imagesPath?.length > 0 || p.imagePath).length}
                            label="Plantas com Imagem"
                            loading={loadingPlants}
                        />
                        <StatBox value={stats.messageCount || 0} label="Mensagens Recebidas" loading={loadingStats} />
                    </div>
                </div>
            </section>
        </div>
    )
}
