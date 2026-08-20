import { useState, useEffect } from 'react';

const REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050';
export default function About() {
    const [formData, setFormData] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
    const [enviado, setEnviado] = useState(false);
    const [stats, setStats] = useState({ plantas: 0, usuarios: 0 });

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem('token')
                const headers = token ? { Authorization: `Bearer ${token}` } : {}

                const [plantsRes, usersRes] = await Promise.all([
                    fetch(`${REACT_APP_YOUR_HOSTNAME}/plant/`),
                    fetch(`${REACT_APP_YOUR_HOSTNAME}/user/`, { headers }),
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setEnviado(true);
        setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
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
                            <img
                                src="https://via.placeholder.com/500x350"
                                alt="Phytografia"
                                className="about-hero__image img-fluid rounded shadow"
                            />
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
                                    { icon: 'fa-calendar-alt',   texto: 'Fundado em 2025/2026' },
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
                            <img
                                src="https://via.placeholder.com/400x500"
                                alt="Nossa História"
                                className="about-history__image img-fluid rounded shadow"
                            />
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
                                icon: 'fa-database', titulo: 'Catálogo Extenso',
                                texto: 'Mais de 1.200 espécies catalogadas com informações detalhadas.',
                                itens: ['Fichas técnicas completas', 'Imagens de alta qualidade', 'Informações de cultivo', 'Dados científicos verificados'],
                            },
                            {
                                icon: 'fa-filter', titulo: 'Busca Inteligente',
                                texto: 'Sistema de pesquisa avançado com múltiplos filtros.',
                                itens: ['Filtro por família botânica', 'Busca por características', 'Pesquisa por nome científico', 'Filtros de clima e solo'],
                            },
                            {
                                icon: 'fa-mobile-alt', titulo: 'Interface Responsiva',
                                texto: 'Acesse de qualquer dispositivo com experiência otimizada.',
                                itens: ['Design responsivo', 'Navegação intuitiva', 'Carregamento rápido', 'Compatível com todos os browsers'],
                            },
                            {
                                icon: 'fa-graduation-cap', titulo: 'Educação Ambiental',
                                texto: 'Recursos educacionais para promover a conscientização sobre a biodiversidade.',
                                itens: ['Artigos científicos', 'Vídeos explicativos', 'Guias de cultivo', 'Eventos e workshops'],
                            
                            },
                            {
                                icon: 'fa-users', titulo: 'Comunidade Ativa',
                                texto: 'Conecte-se com outros entusiastas e especialistas em botânica.',
                                itens: ['Fóruns de discussão', 'Grupos de estudo', 'Colaboração em projetos', 'Compartilhamento de descobertas'],
                            },
                            {
                                icon: 'fa-shield-alt', titulo: 'Segurança e Privacidade',
                                texto: 'Proteção de dados e informações pessoais com padrões de segurança avançados.',
                                itens: ['Criptografia de ponta a ponta', 'Política de privacidade clara', 'Autenticação segura', 'Monitoramento constante de segurança'],
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
                            { nome: 'Renato',         cargo: 'Fonte de informações',             bio: 'Professor na Unesc, com mestrado(pelo que eu lembre).' },
                        ].map((membro, i) => (
                            <div className="col-md-4" key={i}>
                                <div className="about-card card h-100 border-0 shadow-sm text-center p-3">
                                    <div className="card-body">
                                        <img
                                            src="https://via.placeholder.com/100x100"
                                            alt={membro.nome}
                                            className="about-team__image rounded-circle mb-3"
                                            width={100} height={100}
                                        />
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
                            { icon: 'fa-flask',     titulo: 'Rigor Científico', texto: 'Todas as informações são baseadas em pesquisas científicas e validadas por especialistas qualificados.' },
                            { icon: 'fa-handshake', titulo: 'Acessibilidade',   texto: 'Conhecimento botânico deve estar disponível para todos, independentemente do nível de experiência.' },
                            { icon: 'fa-lightbulb', titulo: 'Sustentabilidade', texto: 'Promovemos práticas de cultivo sustentáveis e conscientização ambiental.' },
                            { icon: 'fa-heart',     titulo: 'Colaboração',      texto: 'Acreditamos no poder da comunidade para expandir e enriquecer o conhecimento coletivo.' },
                            { icon: 'fa-users',     titulo: 'Inovação',         texto: 'Utilizamos tecnologia de ponta para criar soluções inovadoras em educação botânica.' },
                            { icon: 'fa-globe',     titulo: 'Paixão',           texto: 'Nossa paixão pela natureza e pelas plantas é o que nos motiva a melhorar constantemente.' },
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
                                    { icon: 'fa-envelope',       titulo: 'Email',       detalhe: 'contato@phytografia.com' },
                                    { icon: 'fa-phone',          titulo: 'Telefone',    detalhe: '(11) 9999-9999' },
                                    { icon: 'fa-map-marker-alt', titulo: 'Localização', detalhe: 'Balneario Gaivota, SC — Brasil' },
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
                                            <button type="submit" className="about-submit btn w-100 py-2 text-white fw-medium">
                                                <i className="fas fa-paper-plane me-2"></i>
                                                Enviar Mensagem
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