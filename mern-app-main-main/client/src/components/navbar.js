import React, { useEffect, useState } from "react";

import { NavLink } from "react-router-dom";
import Logo from "././logo.jpeg";

const getInitialTheme = () => {
    try {
        const savedTheme = window.localStorage.getItem("phyto-theme");
        if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    } catch {
        // O tema padrão continua funcionando mesmo se o armazenamento estiver indisponível.
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function Navbar({ token, role, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
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

    return (
        <nav className="custom-navbar">
            <div className="custom-navbar__inner">
                <NavLink className="custom-navbar__brand" to="/inicio" aria-label="Ir para início">
                    <img className="custom-navbar__logo" src={Logo} alt="Logo do Phytografia" />
                    <span className="custom-navbar__brand-text">Phytografia</span>
                </NavLink>

                <ul className="custom-navbar__menu">
                    <li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/inicio">Início</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/plantlist">Catálogo</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/Sobre">Sobre</NavLink>
                    </li>
                </ul>

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
                                        <NavLink className="custom-navbar__offcanvas-link" to="/dashboardplant" onClick={closeMenu}>
                                            Dashboard P.
                                        </NavLink>
                                    </li>
                                    <hr className="custom-navbar__separator" />
                                </>
                            )}

                            {token ? (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/favoritos" onClick={closeMenu}>
                                            Favoritos
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/configuracoes" onClick={closeMenu}>
                                            Configurações
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/perfil" onClick={closeMenu}>
                                            Perfil
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