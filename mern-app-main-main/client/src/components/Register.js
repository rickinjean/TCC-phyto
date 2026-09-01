import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import API_URL from "../config";
import usePageTitle from "../usePageTitle";

function validarRequisitos(valor) {
    return [
        { label: 'Pelo menos 8 caracteres', ok: valor.length >= 8 },
        { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(valor) },
        { label: 'Uma letra minúscula', ok: /[a-z]/.test(valor) },
        { label: 'Um número', ok: /[0-9]/.test(valor) },
        { label: 'Um caractere especial (! @ # $ % & *)', ok: /[!@#$%&*]/.test(valor) },
        { label: 'Sem espaços', ok: !/\s/.test(valor) && valor.length > 0 },
    ];
}

function calcularForca(valor) {
    if (!valor) return '';
    const atendidos = validarRequisitos(valor).filter(r => r.ok).length;
    if (atendidos <= 2) return 'fraca';
    if (atendidos <= 4) return 'media';
    return 'forte';
}

export default function Register() {
    usePageTitle("Cadastro")
    const [usuario, setUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [forca, setForca] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [showConfirmar, setShowConfirmar] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [sucesso, setSucesso] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMensagem('');
        setSucesso(false);

        const requisitoFalho = validarRequisitos(senha).find(r => !r.ok);
        if (requisitoFalho) {
            setMensagem(`A senha não atende o requisito: ${requisitoFalho.label}`);
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: usuario, email, senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                return setMensagem(data.mensagem || 'Erro ao registrar');
            }

            setSucesso(true);
            setMensagem(data.precisaConfirmarEmail
                ? 'Cadastro realizado! Enviamos um link de confirmação para seu e-mail.'
                : 'Usuário registrado com sucesso!');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            setMensagem('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex">

            {/* Painel esquerdo — hero */}
            <div className="d-none d-md-flex flex-column justify-content-between col-md-5 p-5">
                {/* Logo */}
                <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-leaf"></i>
                    <span className="fw-semibold fs-5">Phytografia</span>
                </div>

                {/* Texto hero */}
                <div>
                    <h1 className="display-5 fw-normal">
                        Junte-se à comunidade botânica
                    </h1>
                    <p className="mt-2">Explore, pesquise e descubra o mundo das plantas</p>
                </div>

                {/* Rodapé do painel */}
                <p className="small">&copy; {new Date().getFullYear()} Phytografia</p>
            </div>

            {/* Painel direito — formulário */}
            <div className="col-12 col-md-7 d-flex align-items-center justify-content-center p-4">
                <div className="w-100" style={{ maxWidth: 400 }}>

                    {/* Logo mobile */}
                    <div className="d-flex d-md-none align-items-center gap-2 mb-4">
                        <i className="fas fa-leaf"></i>
                        <span className="fw-semibold">Phytografia</span>
                    </div>

                    <h2 className="fw-normal mb-1">Criar conta</h2>
                    <p className="mb-4 small">Preencha os dados para se cadastrar</p>

                    {mensagem && (
                        <div className={`alert py-2 small ${sucesso ? 'alert-success' : 'alert-danger'}`} role="alert">
                            {mensagem}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>

                        {/* Campo usuário */}
                        <div className="mb-3">
                            <label htmlFor="usuario" className="form-label small fw-medium">Nome de usuário</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-user"></i>
                                </span>
                                <input
                                    type="text"
                                    id="usuario"
                                    className="form-control"
                                    placeholder="Seu nome de usuário"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo email */}
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label small fw-medium">E-mail</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-envelope"></i>
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-control"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo senha */}
                        <div className="mb-3">
                            <label htmlFor="senha" className="form-label small fw-medium">Senha</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-lock"></i>
                                </span>
                                <input
                                    type={showSenha ? 'text' : 'password'}
                                    id="senha"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => {
                                        setSenha(e.target.value);
                                        setForca(calcularForca(e.target.value));
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={() => setShowSenha(!showSenha)}
                                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    <i className={showSenha ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                </button>
                            </div>

                            {senha && (
                                <div className="password-requirements">
                                    <p className="password-requirements__title">Requisitos da senha:</p>
                                    <ul className="password-requirements__list">
                                        {validarRequisitos(senha).map((r, i) => (
                                            <li key={i} className={`password-requirements__item${r.ok ? ' ok' : ''}`}>
                                                <i className={`fas ${r.ok ? 'fa-check-circle' : 'fa-circle'}`}></i>
                                                {r.label}
                                            </li>
                                        ))}
                                    </ul>
                                    {forca && (
                                        <div className={`password-strength password-strength--${forca}`}>
                                            <span className="password-strength__label">Força da senha: </span>
                                            <span className="password-strength__value">
                                                {forca === 'fraca' ? 'Fraca' : forca === 'media' ? 'Média' : 'Forte'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Campo confirmar senha */}
                        <div className="mb-4">
                            <label htmlFor="confirmarSenha" className="form-label small fw-medium">Confirmar senha</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-lock"></i>
                                </span>
                                <input
                                    type={showConfirmar ? 'text' : 'password'}
                                    id="confirmarSenha"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={() => setShowConfirmar(!showConfirmar)}
                                    aria-label={showConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    <i className={showConfirmar ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                </button>
                            </div>
                            {confirmarSenha && confirmarSenha !== senha && (
                                <div className="text-danger small mt-1" role="alert">
                                    <i className="fas fa-exclamation-circle me-1"></i>As senhas não coincidem.
                                </div>
                            )}
                        </div>

                        {/* Botão registrar */}
                        <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                            {loading ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status" />Criando conta...</>
                            ) : "Criar conta"}
                        </button>

                    </form>

                    {/* Divisor */}
                    <div className="d-flex align-items-center gap-2 my-3">
                        <hr className="flex-grow-1 m-0" />
                        <span className="small">ou registre-se com</span>
                        <hr className="flex-grow-1 m-0" />
                    </div>

                    {/* Social login */}
                    <div className="d-flex gap-2">
    <button type="button" className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2" onClick={() => window.location.href = `${API_URL}/auth/google`}>
        <FontAwesomeIcon icon={faGoogle} />
        <span className="small">Google</span>
    </button>

    <button type="button" className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2" onClick={() => window.location.href = `${API_URL}/auth/github`}>
        <FontAwesomeIcon icon={faGithub} />
        <span className="small">GitHub</span>
    </button>
</div>

                    {/* Link login */}
                    <p className="text-center small mt-4">
                        Já tem conta?{' '}
                        <button
                            className="btn btn-link p-0 small text-decoration-none"
                            onClick={() => navigate('/login')}
                        >
                            Entrar
                        </button>
                    </p>

                </div>
            </div>
        </div>
    );
}