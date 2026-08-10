import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle";
import { NavLink } from "react-router-dom";
import Logo from "././logo.jpeg";

export default function Navbar({ token, role, onLogout }) {
    return (
        <nav className="navbar bg-light p-2">
            <div className="container-fluid">

                {/* Logo / Brand */}
                <NavLink className="navbar-brand" to="/inicio">
                    <img style={{ width: "7%" }} src={Logo} alt="Logo do Phytografia" />
                </NavLink>

                {/* Links principais — sempre visíveis */}
                <ul className="navbar-nav flex-row gap-2 ms-auto me-2">
                        <li className="nav-item">
                        <NavLink className="nav-link" to="/inicio">Início</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link" to="/plantlist">Catálogo</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link" to="/Sobre">Sobre</NavLink>
                    </li>
                </ul>

                {/* Botão que abre o offcanvas */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasNavbar"
                    aria-controls="offcanvasNavbar"
                    aria-label="Abrir menu"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Offcanvas — opções extras */}
                <div
    className="offcanvas offcanvas-end"
    tabIndex="-1"
    id="offcanvasNavbar"
    aria-labelledby="offcanvasNavbarLabel"
    style={{ width: "200px" }}
>
                    <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
                            Menu
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="offcanvas"
                            aria-label="Fechar"
                        ></button>
                    </div>

                    <div className="offcanvas-body">
                        <ul className="navbar-nav flex-column gap-1">

                            {/* Opções ADM */}
                            {token && role === "ADM" && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/create">
                                            C. Usuários
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/userlist">
                                            L. Usuários
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/dashboardplant">
                                            Dashboard P.
                                        </NavLink>
                                    </li>
                                    <hr />
                                </>
                            )}

                            {/* Login / Sair */}
                            {token ? (
                                <li className="nav-item">
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/favoritos">
                                            Favoritos
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/configuracoes">
                                            Configurações
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/perfil">
                                            Perfil
                                        </NavLink>
                                    </li>
                                    <button
                                        className="nav-link btn btn-link"
                                        onClick={onLogout}
                                        style={{ textDecoration: "none" }}
                                    >
                                        Sair
                                    </button>
                                </li>
                            ) : (
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/login">
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