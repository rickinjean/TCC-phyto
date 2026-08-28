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
                    {token && (
                        <li className="nav-item">
                            <NavLink className="custom-navbar__link" to="/favoritos">Favoritos</NavLink>
                        </li>
                    )}
                    <li className="nav-item">
                        <NavLink className="custom-navbar__link" to="/Sobre">Sobre</NavLink>
                    </li>
                    {token && role === "ADM" && (
                        <>
                            <li className="nav-item dropdown">
                                <span className="custom-navbar__link custom-navbar__link--dropdown" style={{cursor: "default"}}>
                                    ADM
                                </span>
                                <ul className="custom-navbar__dropdown">
                                    <li><NavLink className="custom-navbar__dropdown-link" to="/create">C. Usuários</NavLink></li>
                                    <li><NavLink className="custom-navbar__dropdown-link" to="/userlist">L. Usuários</NavLink></li>
                                    <li><NavLink className="custom-navbar__dropdown-link" to="/createplant">C. Plantas</NavLink></li>
                                    <li><NavLink className="custom-navbar__dropdown-link" to="/bulk-create">Lote Plantas</NavLink></li>
                                    <li><NavLink className="custom-navbar__dropdown-link" to="/import">Importar CSV</NavLink></li>
                                </ul>
                            </li>
                        </>
                    )}
                </ul>

                {token && (
                    <div className="custom-navbar__user d-flex align-items-center gap-2 me-2">
                        {userAvatar ? (
                            <img src={userAvatar} alt="" style={{width: 28, height: 28, borderRadius: "50%", objectFit: "cover"}} />
                        ) : (
                            <span style={{width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff"}}>
                                {userName ? userName.charAt(0).toUpperCase() : "?"}
                            </span>
                        )}
                        <span className="small fw-semibold d-none d-lg-inline" style={{maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                            {userName || "Usuário"}
                        </span>
                    </div>
                )}

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
                                        <NavLink className="custom-navbar__offcanvas-link" to="/createplant" onClick={closeMenu}>
                                            C. Plantas
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/bulk-create" onClick={closeMenu}>
                                            Lote Plantas
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="custom-navbar__offcanvas-link" to="/import" onClick={closeMenu}>
                                            Importar CSV
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
                                                <img src={userAvatar} alt="" style={{width: 32, height: 32, borderRadius: "50%", objectFit: "cover"}} />
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