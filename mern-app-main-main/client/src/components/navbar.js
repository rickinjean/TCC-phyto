import React, { useEffect, useState } from "react";

import { NavLink } from "react-router-dom";
import Logo from "./logo.jpeg";

const getInitialTheme = () => {
    try {
        const savedTheme = window.localStorage.getItem("phyto-theme");
        if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    } catch {
        // O tema padrão continua funcionando mesmo se o armazenamento estiver indisponível.
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function Navbar({ token, role, userName, userAvatar, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            window.localStorage.setItem("phyto-theme", theme);
        } catch {
            // A aplicação segue funcionando mesmo sem persistência local.
        }
    }, [theme]);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const toggleTheme = () => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");

    const closeMenu = () => setMenuOpen(false);
    const closeUserMenu = () => setUserMenuOpen(false);

    useEffect(() => {
        if (!userMenuOpen) return;
        const handlePointerDown = (event) => {
            if (!event.target.closest(".custom-navbar__user-menu")) {
                setUserMenuOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [userMenuOpen]);

    return (
        <nav className="custom-navbar">
            <div className="custom-navbar__inner">
                <NavLink className="custom-navbar__brand" to="/inicio" aria-label="Ir para início">
                    <img className="custom-navbar__logo" src={Logo} alt="Logo do Phytografia" decoding="async" />
                    <span className="custom-navbar__brand-text">Phytografia</span>
                </NavLink>

                <ul className="custom-navbar__menu">
                    <li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/inicio">Início</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/plantlist">Catálogo</NavLink>
                    </li>
                    {token && (
                        <li className="nav-item">
                            <NavLink className="custom-navbar__link" to="/favoritos">Favoritos</NavLink>
                        </li>
                    )}
<li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/Sobre">Sobre</NavLink>
                    </li>
                </ul>

                {token ? (
                    <div className="custom-navbar__user-menu">
                        <button
                            type="button"
                            className={`custom-navbar__user-button ${userMenuOpen ? "is-open" : ""}`}
                            aria-expanded={userMenuOpen}
                            aria-haspopup="true"
                            aria-label="Menu do usuário"
                            onClick={() => setUserMenuOpen((prev) => !prev)}
                        >
                            {userAvatar ? (
                                <img className="custom-navbar__user-avatar" src={userAvatar} alt="" decoding="async" />
                            ) : (
                                <span className="custom-navbar__user-avatar custom-navbar__user-avatar--fallback">
                                    {userName ? userName.charAt(0).toUpperCase() : "?"}
                                </span>
                            )}
                            <span className="custom-navbar__user-name">{userName || "Usuário"}</span>
                            {role === "ADM" && (
                                <span className="custom-navbar__user-role">ADM</span>
                            )}
                            <svg className={`custom-navbar__user-caret ${userMenuOpen ? "is-open" : ""}`} viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <div className={`custom-navbar__user-panel ${userMenuOpen ? "is-open" : ""}`}>
                            <div className="custom-navbar__user-panel-header">
                                {userAvatar ? (
                                    <img className="custom-navbar__user-panel-avatar" src={userAvatar} alt="" decoding="async" />
                                ) : (
                                    <span className="custom-navbar__user-panel-avatar custom-navbar__user-panel-avatar--fallback">
                                        {userName ? userName.charAt(0).toUpperCase() : "?"}
                                    </span>
                                )}
                                <div className="custom-navbar__user-panel-meta">
                                    <strong className="custom-navbar__user-panel-name">{userName || "Usuário"}</strong>
                                    <small className="custom-navbar__user-panel-role">
                                        {role === "ADM" ? "Administrador" : "Usuário"}
                                    </small>
                                </div>
                            </div>

                            {role === "ADM" && (
                                <div className="custom-navbar__user-panel-section">
                                    <span className="custom-navbar__user-panel-caption">Administração</span>
                                    <NavLink className="custom-navbar__user-panel-link" to="/create" onClick={closeUserMenu}>
                                        👤 Cadastrar Usuário
                                    </NavLink>
                                    <NavLink className="custom-navbar__user-panel-link" to="/userlist" onClick={closeUserMenu}>
                                        📋 Lista de Usuários
                                    </NavLink>
                                    <NavLink className="custom-navbar__user-panel-link" to="/createplant" onClick={closeUserMenu}>
                                        🌱 Cadastrar Planta
                                    </NavLink>
                                </div>
                            )}

                            <div className="custom-navbar__user-panel-section">
                                <span className="custom-navbar__user-panel-caption">Preferências</span>
                                <button
                                    type="button"
                                    className="custom-navbar__user-panel-action"
                                    onClick={toggleTheme}
                                >
                                    <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
                                    Tema: {theme === "dark" ? "Claro" : "Escuro"}
                                </button>
                            </div>

                            <button
                                type="button"
                                className="custom-navbar__user-panel-logout"
                                onClick={() => {
                                    closeUserMenu();
                                    onLogout();
                                }}
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="d-flex align-items-center gap-2">
                        <NavLink className="custom-navbar__link" to="/login">Entrar</NavLink>
                        <button
                            className="custom-navbar__theme-toggle"
                            type="button"
                            aria-pressed={theme === "dark"}
                            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                            onClick={toggleTheme}
                        >
                            <span className="custom-navbar__theme-icon" aria-hidden="true">
                                {theme === "dark" ? "☀" : "☾"}
                            </span>
                            <span className="custom-navbar__theme-label">
                                {theme === "dark" ? "Claro" : "Escuro"}
                            </span>
                        </button>
                    </div>
                )}

                <button
                    className="custom-navbar__toggle navbar-toggler"

                    type="button"
                    aria-controls="offcanvasNavbar"
                    aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                    onClick={toggleMenu}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div
                    className={`custom-navbar__overlay ${menuOpen ? "is-open" : ""}`}
                    onClick={closeMenu}
                    aria-hidden={!menuOpen}
                />

                <div
                    className={`custom-navbar__offcanvas ${menuOpen ? "is-open" : ""}`}
                    tabIndex="-1"
                    id="offcanvasNavbar"
                    aria-labelledby="offcanvasNavbarLabel"
                    aria-hidden={!menuOpen}
                >
                    <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Fechar"
                            onClick={closeMenu}
                        ></button>
                    </div>

                    <div className="offcanvas-body">
                        <ul className="navbar-nav flex-column gap-1">
                            {token && role === "ADM" && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/create" onClick={closeMenu}>
                                            C. Usuários
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/userlist" onClick={closeMenu}>
                                            L. Usuários
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/createplant" onClick={closeMenu}>
                                            C. Plantas
                                        </NavLink>
                                    </li>
                                    <hr className="custom-navbar__separator" />
                                </>
                            )}

                            {token ? (
                                <>
                                    {userName && (
                                        <li className="nav-item d-flex align-items-center gap-2 px-3 py-2">
                                            {userAvatar ? (
                                                <img src={userAvatar} alt="" decoding="async" style={{width: 32, height: 32, borderRadius: "50%", objectFit: "cover"}} />
                                            ) : (
                                                <span style={{width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff"}}>
                                                    {userName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <span className="fw-semibold">{userName}</span>
                                        </li>
                                    )}
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/inicio" onClick={closeMenu}>
                                            Início
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/plantlist" onClick={closeMenu}>
                                            Catálogo
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/Sobre" onClick={closeMenu}>
                                            Sobre
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/favoritos" onClick={closeMenu}>
                                            Favoritos
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className="custom-navbar__offcanvas-button"
                                            onClick={() => {
                                                closeMenu();
                                                onLogout();
                                            }}
                                            type="button"
                                        >
                                            Sair
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <li className="nav-item">
                                    <NavLink className="custom-navbar__offcanvas-link" to="/login" onClick={closeMenu}>
                                        Login
                                    </NavLink>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}