import { CORES_PALETA } from "../listaCores"

export default function PaletaCores({ valor, onChange }) {
    return (
        <div className="paleta-cores" role="radiogroup" aria-label="Cor da coleção">
            {CORES_PALETA.map(cor => (
                <button
                    key={cor}
                    type="button"
                    className={`paleta-cores__swatch ${valor === cor ? "is-active" : ""}`}
                    onClick={() => onChange(cor)}
                    aria-pressed={valor === cor}
                    aria-label={`Cor da coleção ${cor}`}
                    style={{ backgroundColor: cor }}
                >
                    {valor === cor && (
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="#ffffff" aria-hidden="true">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                    )}
                </button>
            ))}
        </div>
    )
}