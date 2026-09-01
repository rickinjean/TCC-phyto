import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import API_URL from "../config"
import authFetch from "../authFetch"

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

export default function Create() {
    const [form, setForm] = useState({
        name: "",
        user: "",
        email: "",
        function: "",
        senha: "",
        confirmarSenha: ""
    })
    const [forca, setForca] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    function updateForm(value) {
        setForm((prev) => {
            return { ...prev, ...value }
        })
    }

    async function onSubmit(e) {
        e.preventDefault()
        setError("")

        const requisitoFalho = validarRequisitos(form.senha).find(r => !r.ok);
        if (requisitoFalho) {
            setError(`A senha não atende o requisito: ${requisitoFalho.label}`)
            return
        }

        if (form.senha !== form.confirmarSenha) {
            setError("As senhas não coincidem.")
            return
        }

        setLoading(true)

        const newPerson = { ...form }
        delete newPerson.confirmarSenha

        try {
            const response = await authFetch(`${API_URL}/user/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPerson)
            })

            if (response === null) {
                setError("Sessão expirada. Faça login novamente.")
                return
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.message || `Erro: ${response.statusText}`)
                return
            }

            setForm({ name: "", user: "", email: "", function: "", senha: "", confirmarSenha: "" })
            setForca("")
            navigate("/")
        } catch {
            setError("Erro ao conectar com o servidor")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="admin-page admin-page--form">
            <h3 className="admin-page__title">Cadastrar novo usuário</h3>
            <form className="admin-form" onSubmit={onSubmit}>
                {error && (
                    <div className="alert alert-danger py-2">{error}</div>
                )}
                <div className="form-group">
                    <label htmlFor="name">Nome completo</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={form.name}
                        onChange={(e) => updateForm({ name: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="user">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        id="user"
                        value={form.user}
                        onChange={(e) => updateForm({ user: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">E-mail</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={form.email}
                        onChange={(e) => updateForm({ email: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="senha">Senha</label>
                    <input
                        type="password"
                        className="form-control"
                        id="senha"
                        value={form.senha}
                        onChange={(e) => {
                            updateForm({ senha: e.target.value })
                            setForca(calcularForca(e.target.value))
                        }}
                    />
                    {form.senha && (
                        <div className="password-requirements">
                            <p className="password-requirements__title">Requisitos da senha:</p>
                            <ul className="password-requirements__list">
                                {validarRequisitos(form.senha).map((r, i) => (
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
                <div className="form-group">
                    <label htmlFor="confirmarSenha">Confirmar senha</label>
                    <input
                        type="password"
                        className="form-control"
                        id="confirmarSenha"
                        value={form.confirmarSenha}
                        onChange={(e) => updateForm({ confirmarSenha: e.target.value })}
                    />
                    {form.confirmarSenha && form.confirmarSenha !== form.senha && (
                        <div className="text-danger small mt-1" role="alert">
                            <i className="fas fa-exclamation-circle me-1"></i>As senhas não coincidem.
                        </div>
                    )}
                </div>
                <div className="form-group">
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="positionOptions"
                            id="positionUsuario"
                            value="User"
                            checked={form.function === "User"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionUsuario" className="form-check-label">Usuário</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="positionOptions"
                            id="positionADM"
                            value="ADM"
                            checked={form.function === "ADM"}
                            onChange={(e) => updateForm({ function: e.target.value })}
                        />
                        <label htmlFor="positionADM" className="form-check-label">ADM</label>
                    </div>
                </div>
                <div className="form-group">
                    <input
                        type="submit"
                        value={loading ? "Cadastrando..." : "Enviar dados"}
                        className="btn btn-primary"
                        disabled={loading}
                    />
                </div>
            </form>
        </div>
    )
}