const VARIANTS = {
    card: { button: "plant-list-card__favorite", badge: "plant-list-card__favorite-badge", size: 18 },
    details: { button: "plant-details-favorite-btn", badge: "plant-details-favorite-btn-badge", size: 24 },
}

export default function FavoriteButton({ variant = "card", corColecao, qtdColecoes = 0, texto, onClick }) {
    const v = VARIANTS[variant] || VARIANTS.card
    const style = corColecao
        ? variant === "details"
            ? { color: corColecao, borderColor: corColecao }
            : { color: corColecao }
        : undefined

    return (
        <button
            type="button"
            className={`${v.button} ${corColecao ? "is-favorite" : ""}`}
            onClick={onClick}
            aria-label={texto}
            title={texto}
            style={style}
        >
            <svg viewBox="0 0 24 24" width={v.size} height={v.size} fill={corColecao ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {qtdColecoes > 1 && (
                <span className={v.badge}>{qtdColecoes}</span>
            )}
        </button>
    )
}