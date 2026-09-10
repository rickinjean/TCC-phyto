import { useState } from 'react';

function FotoOuInicial({ foto, nome }) {
    const [erro, setErro] = useState(false);
    if (foto && !erro) {
        return <img src={foto} alt={nome} className="w-100 h-100" style={{ objectFit: "cover" }} onError={() => setErro(true)} />;
    }
    return nome.charAt(0);
}

export function AboutCircleCard({ icon, titulo, texto }) {
    return (
        <div className="col-md-6 col-lg-4">
            <div className="about-card card h-100 border-0 shadow-sm text-center p-3">
                <div className="card-body">
                    <div className="about-icon about-icon--circle mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle">
                        <i className={`fas ${icon} fs-5 about-icon__glyph`}></i>
                    </div>
                    <h5 className="about-card__title card-title">{titulo}</h5>
                    <p className="card-text text-muted small">{texto}</p>
                </div>
            </div>
        </div>
    );
}

export function AboutResourceCard({ icon, titulo, texto, itens }) {
    return (
        <div className="col-md-4">
            <div className="about-card card h-100 border-0 shadow-sm p-2">
                <div className="card-body">
                    <div className="about-icon about-icon--square mb-3 d-flex align-items-center justify-content-center rounded">
                        <i className={`fas ${icon} fs-5 about-icon__glyph`}></i>
                    </div>
                    <h5 className="about-card__title card-title">{titulo}</h5>
                    <p className="card-text text-muted small mb-3">{texto}</p>
                    <ul className="list-unstyled small text-muted">
                        {itens.map(item => (
                            <li key={item} className="mb-1">
                                <i className="fas fa-check me-2 about-icon__glyph"></i>{item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export function TeamCard({ membro }) {
    return (
        <div className="col-md-4">
            <div className="about-card card h-100 border-0 shadow-sm text-center p-3">
                <div className="card-body">
                    <div
                        className="about-team__image rounded-circle mb-3 d-flex align-items-center justify-content-center mx-auto overflow-hidden"
                        style={{ width: 100, height: 100, background: "var(--accent, #4a7c59)", color: "#fff", fontSize: 32, fontWeight: 600 }}
                    >
                        <FotoOuInicial foto={membro.foto} nome={membro.nome} />
                    </div>
                    <h5 className="about-card__title card-title mb-1">{membro.nome}</h5>
                    <p className="about-team__role small fw-medium mb-2">{membro.cargo}</p>
                    <p className="card-text text-muted small mb-3">{membro.bio}</p>
                </div>
            </div>
        </div>
    );
}