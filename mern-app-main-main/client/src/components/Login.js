import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import API_URL from "../config";

export default function Login({ onLogin }) {
    const [user, setUser] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const goToRegister = () => {
        navigate('/register');
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: user, senha: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.mensagem || 'Erro no login');
                return;
            }

            localStorage.setItem('token', data.token);
            onLogin(data.token);
            navigate('/');
        } catch (error) {
            setError('Erro na conexão com o servidor');
        } finally {
            setLoading(false)
        }
    }

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
                        Sistema de pesquisa botânica
                    </h1>
                    <p className="mt-2">Ciência, tecnologia e natureza</p>
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

                    <h2 className="fw-normal mb-1">Bem-vindo de volta</h2>
                    <p className="mb-4 small">Acesse sua conta para continuar</p>

                    {error && (
                        <div className="alert alert-danger py-2 small" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* Campo usuário */}
                        <div className="mb-3">
                            <label className="form-label small fw-medium">Usuário</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-user"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Seu nome de usuário"
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo senha */}
                        <div className="mb-3">
                            <label className="form-label small fw-medium">Senha</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-lock"></i>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                        </div>

                        {/* Lembrar + esqueci */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check">
                                <input type="checkbox" className="form-check-input" id="remember" />
                                <label className="form-check-label small" htmlFor="remember">
                                    Lembrar de mim
                                </label>
                            </div>
                            {/* <a href="#" className="small text-decoration-none">
                                Esqueceu a senha?
                            </a> */}
                        </div>

                        {/* Botão entrar */}
                        <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                            {loading ? (
                                <><span className="spinner-border spinner-border-sm me-2" role="status" />Entrando...</>
                            ) : "Entrar"}
                        </button>

                    </form>

                    {/* Divisor */}
                    <div className="d-flex align-items-center gap-2 my-3">
                        <hr className="flex-grow-1 m-0" />
                        <span className="small">ou continue com</span>
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

                    {/* Link cadastro */}
                    <p className="text-center small mt-4">
                        Não tem conta?{" "}
                        <button
                            className="btn btn-link p-0 small text-decoration-none"
                            onClick={goToRegister}
                        >
                            Cadastre-se
                        </button>
                    </p>

                </div>
            </div>
        </div>
    )
}