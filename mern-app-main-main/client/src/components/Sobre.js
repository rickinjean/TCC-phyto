import { useState, useEffect } from 'react';
import API_URL from "../config";

export default function About() {
    const [formData, setFormData] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
    const [enviado, setEnviado] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erroEnvio, setErroEnvio] = useState('');
    const [stats, setStats] = useState({ plantas: 0, usuarios: 0 });

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem('token')
                const headers = token ? { Authorization: `Bearer ${token}` } : {}

                const [plantsRes, usersRes] = await Promise.all([
                    fetch(`${API_URL}/plant/`),
                    fetch(`${API_URL}/user/`, { headers }),
                ]);

                if (!plantsRes.ok) return;

                const plantData = await plantsRes.json();
                let usersCount = 0;

                if (usersRes.ok) {
                    const userData = await usersRes.json();
                    usersCount = userData.length;
                }

                setStats({ plantas: plantData.length, usuarios: usersCount });
            } catch (error) {
                console.error('Erro ao buscar estatísticas:', error);
            }
        }

        fetchStats();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErroEnvio('');
        setEnviando(true);
        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setErroEnvio(data.message || 'Erro ao enviar mensagem.');
                return;
            }

            setEnviado(true);
            setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
        } catch {
            setErroEnvio('Erro na conexão com o servidor.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <>
            {/* ── HERO ── */}
            <section className="about-section about-hero py-5">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-md-6">
                            <span className="about-badge">
                                <i className="fas fa-leaf me-1"></i> Pesquisa Botânica
                            </span>
                            <h1 className="about-hero__title display-5 fw-normal mb-3">Sobre o Phytografia</h1>
                            <p className="lead text-muted mb-4">
                                Sistema completo de pesquisa botânica que combina ciência, 
                                <br />tecnologia e educação para aproximar as pessoas do mundo das plantas.
                            </p>
                            <div className="row text-center g-3">
                                {[
                                    { numero: stats.plantas.toLocaleString('pt-BR'), label: 'Plantas Catalogadas' },
                                    { numero: stats.usuarios.toLocaleString('pt-BR'), label: 'Usuários Ativos' },
                                ].map((stat, i) => (
                                    <div className="col-6" key={i}>
                                        <div className="about-stat p-3 rounded">
                                            <div className="about-stat__number fs-4 fw-bold">{stat.numero}</div>
                                            <small className="text-muted">{stat.label}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="about-hero__image img-fluid rounded shadow d-flex align-items-center justify-content-center" style={{background: "var(--surface-alt, #f0f4f0)", minHeight: 280}}>
                                <i className="fas fa-leaf" style={{fontSize: 80, color: "var(--accent, #4a7c59)", opacity: 0.3}}></i>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MISSÃO ── */}
            <section className="about-section about-section--surface py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="about-section__title fw-normal">Nossa Missão</h2>
                        <p className="text-muted">Democratizar o conhecimento botânico através da tecnologia</p>
                    </div>
                    <div className="row g-4">
                        {[
                            { icon: 'fa-seedling',  titulo: 'Educação Botânica',  texto: 'Tornar o conhecimento sobre plantas acessível a todos, desde iniciantes até especialistas.' },
                            { icon: 'fa-search',    titulo: 'Pesquisa Avançada',  texto: 'Ferramentas de pesquisa com múltiplos filtros para encontrar plantas específicas rapidamente.' },
                            { icon: 'fa-users',     titulo: 'Comunidade',         texto: 'Conectar entusiastas, jardineiros e botânicos em uma rede colaborativa.' },
                        ].map((card, i) => (
                            <div className="col-md-6 col-lg-4" key={i}>
                                <div className="about-card card h-100 border-0 shadow-sm text-center p-3">
                                    <div className="card-body">
                                        <div className="about-icon about-icon--circle mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle">
                                            <i className={`fas ${card.icon} fs-5 about-icon__glyph`}></i>
                                        </div>
                                        <h5 className="about-card__title card-title">{card.titulo}</h5>
                                        <p className="card-text text-muted small">{card.texto}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HISTÓRIA ── */}
            <section className="about-section about-section--tinted py-5">
                <div className="container">
                    <div className="row align-items-center g-5">
                        <div className="col-md-7">
                            <h2 className="about-section__title fw-normal mb-4">Nossa História</h2>
                            <p className="text-muted">
                                O Phytografia nasceu da ideia, cujo foi dita por uma professorea e da necessidade de espalhar 
                                o conhecimento sobre plantas. Fundada em 2025 por uma equipe(duas pessoas) desenvolvedores e 
                                designers, o projeto começou como uma simples ideia: criar uma plataforma que tornasse a 
                                identificação e o estudo de plantas mais acessível e envolvente.
                            </p>
                            <p className="text-muted">
                                Inspirados pela rica biodiversidade brasileira e pela crescente necessidade de educação 
                                ambiental, desenvolvemos um sistema que combina rigor científico com interface intuitiva. 
                                Cada planta em nosso catálogo é cuidadosamente documentada por especialistas(nós mesmos), 
                                garantindo informações precisas e confiáveis.(pelo menos eu acho que são)
                            </p>
                            <div className="d-flex flex-column gap-2 mt-4">
                                {[
                                    { icon: 'fa-calendar-alt',   texto: 'Desenvolvido em 2025/2026' },
                                    { icon: 'fa-globe-americas', texto: 'Foco na flora brasileira' },
                                    { icon: 'fa-microscope',     texto: 'Base científica sólida' },
                                ].map((item, i) => (
                                    <div className="about-info-item d-flex align-items-center gap-3 p-3 rounded shadow-sm" key={i}>
                                        <i className={`fas ${item.icon} about-icon__glyph`}></i>
                                        <span className="fw-medium">{item.texto}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-5">
                            <div className="about-history__image img-fluid rounded shadow d-flex align-items-center justify-content-center" style={{background: "var(--surface-alt, #f0f4f0)", minHeight: 320}}>
                                <i className="fas fa-history" style={{fontSize: 70, color: "var(--accent, #4a7c59)", opacity: 0.3}}></i>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── RECURSOS ── */}
            <section className="about-section about-section--surface py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="about-section__title fw-normal">Recursos do Sistema</h2>
                        <p className="text-muted">Ferramentas avançadas para explorar o mundo das plantas</p>
                    </div>
                    <div className="row g-4">
                        {[
                            {
                                icon: 'fa-database', titulo: 'Catálogo de Plantas',
                                texto: 'Acervo de plantas catalogadas com informações detalhadas e verificadas.',
                                itens: ['Fichas técnicas completas', 'Dados de origem e habitat', 'Informações de cultivo', 'Características morfológicas'],
                            },
                            {
                                icon: 'fa-filter', titulo: 'Busca Inteligente',
                                texto: 'Sistema de pesquisa avançado com múltiplos filtros.',
                                itens: ['Filtro por família botânica', 'Busca por características', 'Pesquisa por nome científico', 'Filtros de origem e luminosidade'],
                            },
                            {
                                icon: 'fa-mobile-alt', titulo: 'Interface Responsiva',
                                texto: 'Acesse de qualquer dispositivo com experiência otimizada.',
                                itens: ['Design responsivo', 'Navegação intuitiva', 'Carregamento rápido', 'Tema claro e escuro'],
                            },
                            {
                                icon: 'fa-graduation-cap', titulo: 'Educação Ambiental',
                                texto: 'Conteúdo educacional para promover a conscientização sobre a biodiversidade.',
                                itens: ['Informações científicas acessíveis', 'Dados de conservação', 'Curiosidades sobre espécies', 'Referências bibliográficas'],
                            },
                            {
                                icon: 'fa-heart', titulo: 'Sistema de Favoritos',
                                texto: 'Salve suas plantas favoritas para consulta rápida.',
                                itens: ['Adição e remoção rápida', 'Lista personalizada', 'Acesso direto ao catálogo', 'Sincronização com a conta'],
                            },
                            {
                                icon: 'fa-shield-alt', titulo: 'Segurança e Privacidade',
                                texto: 'Proteção de dados pessoais com autenticação segura.',
                                itens: ['Autenticação por JWT', 'Login com Google e GitHub', 'Controle de acesso por roles', 'Senhas criptografadas'],
                            },
                        ].map((card, i) => (
                            <div className="col-md-4" key={i}>
                                <div className="about-card card h-100 border-0 shadow-sm p-2">
                                    <div className="card-body">
                                        <div className="about-icon about-icon--square mb-3 d-flex align-items-center justify-content-center rounded">
                                            <i className={`fas ${card.icon} fs-5 about-icon__glyph`}></i>
                                        </div>
                                        <h5 className="about-card__title card-title">{card.titulo}</h5>
                                        <p className="card-text text-muted small mb-3">{card.texto}</p>
                                        <ul className="list-unstyled small text-muted">
                                            {card.itens.map((item, j) => (
                                                <li key={j} className="mb-1">
                                                    <i className="fas fa-check me-2 about-icon__glyph"></i>{item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── EQUIPE ── */}
            <section className="about-section about-section--tinted py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="about-section__title fw-normal">Nossa Equipe</h2>
                        <p className="text-muted">Profissionais dedicados à excelência em botânica e tecnologia</p>
                    </div>
                    <div className="row g-4 justify-content-center">
                        {[
                            { nome: 'Dr. Jean Lucas', cargo: 'Estudante(Chefe)',                 bio: 'PhD em tomar café, especialista em videojogos com mais de 15 anos de experiência.' },
                            { nome: 'Henrique P',     cargo: 'Desenvolvedor Full-Stack(confia)', bio: 'Engenheiro de Software especializada em aplicações web, responsável pela arquitetura e desenvolvimento do sistema.' },
                            { nome: 'Renato Bettin',  cargo: 'Orientador',                      bio: 'Professor na IFC Campus Sombrio, orientador do Trabalho de Conclusão de Curso. Especialista em desenvolvimento de software e engenharia de sistemas.' },
                        ].map((membro, i) => (
                            <div className="col-md-4" key={i}>
                                <div className="about-card card h-100 border-0 shadow-sm text-center p-3">
                                    <div className="card-body">
                                        <div
                                            className="about-team__image rounded-circle mb-3 d-flex align-items-center justify-content-center mx-auto"
                                            style={{width: 100, height: 100, background: "var(--accent, #4a7c59)", color: "#fff", fontSize: 32, fontWeight: 600}}
                                        >
                                            {membro.nome.charAt(0)}
                                        </div>
                                        <h5 className="about-card__title card-title mb-1">{membro.nome}</h5>
                                        <p className="about-team__role small fw-medium mb-2">{membro.cargo}</p>
                                        <p className="card-text text-muted small mb-3">{membro.bio}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── VALORES ── */}
            <section className="about-section about-section--surface py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="about-section__title fw-normal">Nossos Valores</h2>
                        <p className="text-muted">Os princípios que guiam o Phytografia</p>
                    </div>
                    <div className="row g-4">
                        {[
                            { icon: 'fa-flask',     titulo: 'Rigor Científico', texto: 'As informações são baseadas em fontes científicas confiáveis e referências bibliográficas verificadas.' },
                            { icon: 'fa-handshake', titulo: 'Acessibilidade',   texto: 'Conhecimento botânico deve estar disponível para todos, com interface intuitiva e navegação simples.' },
                            { icon: 'fa-lightbulb', titulo: 'Sustentabilidade', texto: 'Promovemos a conscientização sobre a importância das plantas para o equilíbrio ambiental.' },
                            { icon: 'fa-heart',     titulo: 'Paixão pela Botânica', texto: 'O interesse por plantas e biodiversidade é o que nos motiva a melhorar constantemente o sistema.' },
                        ].map((valor, i) => (
                            <div className="col-md-6 col-lg-4" key={i}>
                                <div className="about-card card h-100 border-0 shadow-sm text-center p-3">
                                    <div className="card-body">
                                        <div className="about-icon about-icon--circle mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle">
                                            <i className={`fas ${valor.icon} fs-5 about-icon__glyph`}></i>
                                        </div>
                                        <h5 className="about-card__title card-title">{valor.titulo}</h5>
                                        <p className="card-text text-muted small">{valor.texto}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTATO ── */}
            <section className="about-section about-section--tinted py-5">
                <div className="container">
                    <div className="row g-5">

                        <div className="col-md-5">
                            <h2 className="about-section__title fw-normal mb-2">Entre em Contato</h2>
                            <p className="text-muted mb-4">Tem dúvidas, sugestões ou quer colaborar conosco?</p>
                            <div className="d-flex flex-column gap-3">
                                {[
                                    { icon: 'fa-envelope',       titulo: 'Email',       detalhe: 'Entre em contato pelo formulário ao lado' },
                                    { icon: 'fa-university',     titulo: 'Instituição', detalhe: 'IFC — Instituto Federal Catarinense, Campus Sombrio' },
                                    { icon: 'fa-map-marker-alt', titulo: 'Localização', detalhe: 'Criciúma, SC — Brasil' },
                                ].map((m, i) => (
                                    <div className="about-info-item d-flex align-items-center gap-3 p-3 rounded shadow-sm" key={i}>
                                        <div className="about-contact-icon d-flex align-items-center justify-content-center rounded-circle">
                                            <i className={`fas ${m.icon} about-icon__glyph`}></i>
                                        </div>
                                        <div>
                                            <div className="about-contact-item__title fw-medium small">{m.titulo}</div>
                                            <div className="text-muted small">{m.detalhe}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-7">
                            <div className="about-contact-form card border-0 shadow-sm p-4">
                                {enviado && (
                                    <div className="alert alert-success small py-2">
                                        Mensagem enviada com sucesso! Entraremos em contato em breve.
                                    </div>
                                )}
                                {erroEnvio && (
                                    <div className="alert alert-danger small py-2">
                                        {erroEnvio}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-medium">Nome</label>
                                            <input type="text" className="form-control" placeholder="Seu nome"
                                                value={formData.nome}
                                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-medium">Email</label>
                                            <input type="email" className="form-control" placeholder="seu@email.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-medium">Assunto</label>
                                            <select className="form-select" value={formData.assunto}
                                                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                                                required>
                                                <option value="">Selecione um assunto</option>
                                                <option value="duvida">Dúvida</option>
                                                <option value="sugestao">Sugestão</option>
                                                <option value="colaboracao">Colaboração</option>
                                                <option value="bug">Reportar Bug</option>
                                                <option value="outro">Outro</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-medium">Mensagem</label>
                                            <textarea className="form-control" rows={5} placeholder="Escreva sua mensagem..."
                                                value={formData.mensagem}
                                                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                                                required />
                                        </div>
                                        <div className="col-12">
                                            <button type="submit" className="about-submit btn w-100 py-2 text-white fw-medium" disabled={enviando}>
                                                {enviando ? (
                                                    <><span className="spinner-border spinner-border-sm me-2" role="status" />Enviando...</>
                                                ) : (
                                                    <><i className="fas fa-paper-plane me-2"></i>Enviar Mensagem</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}