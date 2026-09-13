// Dropdown de seleção do modelo ativo (KNN treinado no app).
export default function ModelSelector({ modelos, selecionadoId, onSelecionar, desabilitado }) {
    return (
        <div className="identificador__selector">
            <label className="identificador__selector-label" htmlFor="modelo-ativo">
                Modelo ativo
            </label>
            <select
                id="modelo-ativo"
                className="form-select"
                value={selecionadoId || ""}
                onChange={function (e) {
                    const id = e.target.value
                    const modelo = modelos.find(function (m) { return m._id === id })
                    onSelecionar(modelo || null)
                }}
                disabled={desabilitado}
            >
                <option value="">— Nenhum modelo selecionado —</option>
                {modelos.map(function (m) {
                    return (
                        <option key={m._id} value={m._id}>
                            {m.nome} · {m.totalClasses} classe(s) · Treinado no app
                        </option>
                    )
                })}
            </select>
            {modelos.length === 0 && (
                <small className="form-text text-muted">
                    Nenhum modelo disponível. Fale com um administrador.
                </small>
            )}
        </div>
    )
}