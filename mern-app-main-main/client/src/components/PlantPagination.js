export default function PlantPagination({ totalPlants, pageSize, safePage, totalPages, onPage }) {
    const startCount = totalPlants === 0 ? 0 : (safePage - 1) * pageSize + 1
    const endCount = Math.min(safePage * pageSize, totalPlants)

    return (
        <nav className="plant-list-pagination d-flex align-items-center justify-content-between gap-2 flex-wrap mt-2" aria-label="Paginação">
            <span className="plant-list-pagination__info">
                Mostrando {startCount}–{endCount} de {totalPlants} {totalPlants === 1 ? "planta" : "plantas"}
            </span>
            <div className="d-flex align-items-center gap-2">
                <button
                    type="button"
                    className="btn btn-sm plant-list-pagination__btn"
                    onClick={() => onPage(safePage - 1)}
                    disabled={safePage <= 1}
                >
                    Anterior
                </button>
                <span className="plant-list-pagination__page">Página {safePage} de {totalPages}</span>
                <button
                    type="button"
                    className="btn btn-sm plant-list-pagination__btn"
                    onClick={() => onPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                >
                    Próximo
                </button>
            </div>
        </nav>
    )
}