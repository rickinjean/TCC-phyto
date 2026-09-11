// Card de uma classe do Treinador: nome editável, contagem de exemplos,
// captura por "segurar para gravar" (webcam) e upload de imagens.
export default function ClasseCard({ classe, contagem, desabilitado, webcamAtiva, gravando, onInicioGravacao, onFimGravacao, onUpload, onRenomear, onRemover }) {
    return (
        <div className={`classe-classe ${gravando ? "classe-classe--gravando" : ""}`}>
            <button
                type="button"
                className="classe-classe__remover"
                title={"Remover classe " + classe.nome}
                aria-label={"Remover classe " + classe.nome}
                disabled={desabilitado}
                onClick={function () { if (onRemover && window.confirm("Remover esta classe e seus exemplos?")) onRemover(classe.id) }}
            >
                ✕
            </button>
            <input
                className="forms-xs classe-classe__nome"
                value={classe.nome}
                aria-label={"Nome da classe " + classe.id}
                onChange={function (e) { onRenomear(classe.id, e.target.value) }}
                disabled={desabilitado}
            />
            <span className="classe-classe__contagem">
                {contagem} {contagem === 1 ? "exemplo" : "exemplos"}
            </span>

            <button
                type="button"
                className="btn btn-sm btn-outline-primary classe-classe__gravar"
                disabled={desabilitado || !webcamAtiva}
                onPointerDown={function () { if (webcamAtiva && !desabilitado) onInicioGravacao(classe.id) }}
                onPointerUp={onFimGravacao}
                onPointerLeave={onFimGravacao}
                onPointerCancel={onFimGravacao}
            >
                {gravando ? "🔄 Gravando…" : webcamAtiva ? "📸 Segurar p/ gravar" : "📸 Ative a câmera"}
            </button>

            <label className="btn btn-sm btn-outline-secondary classe-classe__upload">
                📁 Upload imagens
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="d-none"
                    disabled={desabilitado}
                    onChange={function (e) {
                        if (e.target.files && e.target.files.length) {
                            onUpload(e.target.files, classe.id)
                        }
                        e.target.value = ""
                    }}
                />
            </label>
        </div>
    )
}