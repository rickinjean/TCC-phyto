import React, { useState, useEffect, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"
import sortPorNome from "../sortOptions"
import usePageTitle from "../usePageTitle"
import ListaPicker from "./ListaPicker"
import PlantCard from "./PlantCard"
import PlantFilters, { FILTER_FIELDS, PAGE_SIZES, PAGE_SIZE_KEY, DEFAULT_PAGE_SIZE } from "./PlantFilters"
import PlantPagination from "./PlantPagination"

const EmptyState = ({ hasActiveFilters, onClear }) => (
    <div className="plant-list-empty col-12 text-center py-5">
        <div className="plant-list-empty__icon">🌱</div>
        <p className="plant-list-empty__text">
            {hasActiveFilters
                ? "Nenhuma planta encontrada para os filtros aplicados."
                : "Nenhuma planta cadastrada ainda."}
        </p>
        {hasActiveFilters && (
            <button
                className="plant-list-empty__clear btn btn-sm btn-outline-secondary"
                onClick={onClear}
                type="button"
            >
                Limpar Filtros
            </button>
        )}
    </div>
)

export default function PlantList({ role, canFavorite = false }) {
    usePageTitle("Catálogo de Plantas", "Explore o catálogo digital de plantas do Phytografia: fichas técnicas de cultivo, origem e classificação botânica.", "/plantlist")
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [collectionOptions, setCollectionOptions] = useState({})
    const [listasMeta, setListasMeta] = useState([])
    const [membership, setMembership] = useState({})
    const [pickerPlanta, setPickerPlanta] = useState(null)
    const [searchParams, setSearchParams] = useSearchParams()

    const filtersFromURL = {}
    FILTER_FIELDS.forEach(({ key }) => {
        const val = searchParams.get(key)
        if (val) filtersFromURL[key] = val
    })
    const searchFromURL = searchParams.get("search") || ""
    const [filters, setFilters] = useState(filtersFromURL)
    const [searchInput, setSearchInput] = useState(searchFromURL)
    const [searchText, setSearchText] = useState(searchFromURL)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [pageSize, setPageSize] = useState(() => {
        const stored = Number(localStorage.getItem(PAGE_SIZE_KEY))
        return PAGE_SIZES.includes(stored) ? stored : DEFAULT_PAGE_SIZE
    })
    const [currentPage, setCurrentPage] = useState(1)

    const updateUrl = useCallback((nextFilters, nextSearch) => {
        const params = new URLSearchParams()
        Object.entries(nextFilters).forEach(([k, v]) => { if (v) params.append(k, v) })
        if (nextSearch) params.append("search", nextSearch)
        setSearchParams(params, { replace: true })
    }, [setSearchParams])

    useEffect(() => {
        async function loadCollections() {
            const entries = await Promise.all(
                FILTER_FIELDS.map(async ({ key }) => {
                    try {
                        const res = await fetch(`${API_URL}/collections/${key}`)
                        if (!res || !res.ok) {
                            console.warn(`Falha ao carregar collection "${key}": ${res?.status}`)
                            return [key, []]
                        }
                        const data = await res.json()
                        return [key, sortPorNome(data, key)]
                    } catch (err) {
                        console.error(`Erro ao buscar collection "${key}":`, err)
                        return [key, []]
                    }
                })
            )
            setCollectionOptions(Object.fromEntries(entries))
        }
        loadCollections()
    }, [])

    useEffect(() => {
        if (!canFavorite) return;
        async function loadMembership() {
            try {
                const res = await authFetch(`${API_URL}/userlists/membership`)
                if (res && res.ok) {
                    const data = await res.json()
                    setListasMeta(data.lists || [])
                    setMembership(data.membership || {})
                }
            } catch (err) {
                console.error("Erro ao carregar coleções:", err)
            }
        }
        loadMembership()
    }, [canFavorite, pickerPlanta])

    const fetchPlants = useCallback(async (activeFilters, searchQuery) => {
        setLoading(true)
        setFetchError(null)
        try {
            const params = new URLSearchParams()
            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value) params.append(key, value)
            })
            if (searchQuery) params.append("search", searchQuery)
            const qs = params.toString()
            const url = qs ? `${API_URL}/plant?${qs}` : `${API_URL}/plant/`
            const response = await fetch(url)
            if (!response.ok) {
                setFetchError(`Erro ao carregar plantas: ${response.statusText}`)
                return
            }
            const data = await response.json()
            setPlants(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPlants(filters, searchText)
    }, [filters, searchText, fetchPlants])

    function handleFilterChange(key, value) {
        setFilters(prev => {
            const next = { ...prev }
            if (value) {
                next[key] = value
            } else {
                delete next[key]
            }
            updateUrl(next, searchText)
            return next
        })
    }

    function clearFilters() {
        setFilters({})
        setSearchText("")
        setSearchInput("")
        setSearchParams({}, { replace: true })
    }

    // Debounce: buscas são disparadas só quando o campo para de mudar (350ms)
    // ou no submit (Enter/Buscar).
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchText) {
                const next = searchInput.trim()
                setSearchText(next)
                updateUrl(filters, next)
            }
        }, 350)
        return () => clearTimeout(timer)
    }, [searchInput, searchText, filters, updateUrl])

    function handleSearchSubmit(e) {
        e.preventDefault()
        const next = searchInput.trim()
        setSearchText(next)
        updateUrl(filters, next)
    }

    const hasActiveFilters = Object.keys(filters).length > 0 || searchInput.trim().length > 0

    const totalPlants = plants.length
    const totalPages = Math.max(1, Math.ceil(totalPlants / pageSize))
    const safePage = Math.min(currentPage, totalPages)
    const visiblePlants = plants.slice((safePage - 1) * pageSize, safePage * pageSize)

    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchText])

    function changePageSize(delta) {
        setCurrentPage(1)
        setPageSize(prev => {
            const idx = PAGE_SIZES.indexOf(prev)
            const nextIdx = Math.min(Math.max(idx + delta, 0), PAGE_SIZES.length - 1)
            const next = PAGE_SIZES[nextIdx]
            localStorage.setItem(PAGE_SIZE_KEY, String(next))
            return next
        })
    }

    function goToPage(page) {
        const target = Math.max(1, Math.min(page, totalPages))
        if (target !== safePage) {
            setCurrentPage(target)
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }

    function corDaPlanta(plantId) {
        const ids = membership[String(plantId)]
        if (!ids || ids.length === 0) return null
        const meta = listasMeta.find(l => String(l._id) === ids[0])
        return meta && meta.color ? meta.color : null
    }

    function colecoesDaPlanta(plantId) {
        return membership[String(plantId)] || []
    }

    function nomesDasColecoes(plantId) {
        return colecoesDaPlanta(plantId)
            .map(id => {
                const meta = listasMeta.find(l => String(l._id) === id)
                return meta ? meta.name : null
            })
            .filter(Boolean)
    }

    async function deleteRecord(id) {
        if (!window.confirm("Deseja remover esta planta da lista?")) return

        const res = await authFetch(`${API_URL}/plant/${id}`, { method: "DELETE" })
        if (res && res.ok) {
            setPlants(prev => prev.filter(p => p._id !== id))
        }
    }

    return (
        <div className="plant-list-page container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                {role === "ADM" && (
                    <div>
                        <h3 className="plant-list-page__title mb-0 fw-semibold">
                            Lista de Plantas
                        </h3>
                        {!loading && (
                            <span className="plant-list-page__count">
                                {plants.length} {plants.length === 1 ? "planta" : "plantas"} {hasActiveFilters ? "encontradas" : "cadastradas"}
                            </span>
                        )}
                    </div>
                )}
                {role === "ADM" && (
                    <div className="d-flex gap-2">
                        <Link
                            to="/createplant"
                            className="plant-list-add btn btn-sm"
                        >
                            + Nova planta
                        </Link>
                    </div>
                )}
            </div>

            <form onSubmit={handleSearchSubmit} className="plant-search mb-3" role="search">
                <div className="plant-search__box d-flex align-items-center">
                    <i className="fas fa-magnifying-glass plant-search__icon" aria-hidden="true"></i>
                    <input
                        type="text"
                        className="form-control plant-search__input"
                        placeholder="Buscar planta por nome ou nome científico..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        aria-label="Buscar planta"
                    />
                    <button type="submit" className="btn plant-search__btn">
                        Buscar
                    </button>
                </div>
            </form>

            <PlantFilters
                filters={filters}
                filtersOpen={filtersOpen}
                onToggle={() => setFiltersOpen(o => !o)}
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
                collectionOptions={collectionOptions}
                onFilterChange={handleFilterChange}
                pageSize={pageSize}
                onChangePageSize={changePageSize}
            />

            {fetchError && (
                <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3" role="alert">
                    <span>{fetchError}</span>
                    <button type="button" className="btn-close" onClick={() => setFetchError(null)} aria-label="Fechar" />
                </div>
            )}

            <div className="row">
                {loading ? (
                    <div className="plant-list-loading col-12 text-center py-5">
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        Carregando plantas...
                    </div>
                ) : plants.length > 0 ? (
                    visiblePlants.map(record => (
                        <PlantCard
                            key={record._id}
                            record={record}
                            role={role}
                            canFavorite={canFavorite}
                            deleteRecord={deleteRecord}
                            corColecao={corDaPlanta(record._id)}
                            qtdColecoes={colecoesDaPlanta(record._id).length}
                            nomesColecoes={nomesDasColecoes(record._id)}
                            onOpenPicker={setPickerPlanta}
                        />
                    ))
                ) : (
                    <EmptyState
                        hasActiveFilters={hasActiveFilters}
                        onClear={clearFilters}
                    />
                )}
            </div>

            {!loading && totalPages > 1 && (
                <PlantPagination
                    totalPlants={totalPlants}
                    pageSize={pageSize}
                    safePage={safePage}
                    totalPages={totalPages}
                    onPage={goToPage}
                />
            )}

            {canFavorite && pickerPlanta && (
                <ListaPicker
                    aberto={Boolean(pickerPlanta)}
                    plantaId={String(pickerPlanta._id)}
                    plantaNome={pickerPlanta.name}
                    onFechar={() => setPickerPlanta(null)}
                />
            )}
        </div>
    )
}