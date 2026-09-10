export const FILTER_FIELDS = [
    { key: "type", label: "Tipo" },
    { key: "light", label: "Luz" },
    { key: "height", label: "Altura" },
    { key: "flowercolor", label: "Cor da Flor" },
    { key: "dificulty", label: "Dificuldade" },
    { key: "toxicity", label: "Toxicidade" },
    { key: "origin", label: "Origem" },
    { key: "soil", label: "Solo" },
]

export const PAGE_SIZES = [6, 12, 18, 24]
export const DEFAULT_PAGE_SIZE = 12
export const PAGE_SIZE_KEY = "phyto-plantlist-pagesize"

export default function PlantFilters({
    filters,
    filtersOpen,
    onToggle,
    hasActiveFilters,
    onClear,
    collectionOptions,
    onFilterChange,
    pageSize,
    onChangePageSize,
}) {
    return (
        <div className="plant-filters-toolbar mb-4">
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className={`plant-filters__toggle btn ${filtersOpen ? "is-open" : ""}`}
                        onClick={onToggle}
                        aria-expanded={filtersOpen}
                        aria-controls="plant-filters-body"
                    >
                        <i className={`fas fa-chevron-${filtersOpen ? "up" : "down"} plant-filters__chevron`} aria-hidden="true"></i>
                        Filtros
                        {Object.keys(filters).length > 0 && (
                            <span className="plant-filters__badge">{Object.keys(filters).length}</span>
                        )}
                    </button>
                    {hasActiveFilters && (
                        <button
                            className="plant-filters__clear btn btn-sm btn-outline-secondary"
                            onClick={onClear}
                            type="button"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
                <div className="plant-list-size d-inline-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary plant-list-size__btn"
                        onClick={() => onChangePageSize(-1)}
                        disabled={pageSize <= PAGE_SIZES[0]}
                        aria-label="Diminuir plantas por página"
                    >
                        −
                    </button>
                    <span className="plant-list-size__label">{pageSize} por página</span>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary plant-list-size__btn"
                        onClick={() => onChangePageSize(1)}
                        disabled={pageSize >= PAGE_SIZES[PAGE_SIZES.length - 1]}
                        aria-label="Aumentar plantas por página"
                    >
                        +
                    </button>
                </div>
            </div>
            {filtersOpen && (
                <div className="plant-filters mt-2" id="plant-filters-body">
                    <div className="row g-2">
                        {FILTER_FIELDS.map(({ key, label }) => (
                            <div key={key} className="col-6 col-md-3">
                                <select
                                    className="form-select form-select-sm plant-filters__select"
                                    value={filters[key] || ""}
                                    onChange={(e) => onFilterChange(key, e.target.value)}
                                    aria-label={label}
                                >
                                    <option value="">{label}</option>
                                    {(collectionOptions[key] || []).map(opt => (
                                        <option key={opt._id} value={opt._id}>{opt.name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}