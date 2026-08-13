import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import { NavLink } from "react-router-dom";
import Logo from "././logo.jpeg";
import "./navbar.css";

export default function Navbar({ token, role, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
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