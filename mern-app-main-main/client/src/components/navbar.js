import React from "react";

// We import bootstrap to make our application look better.
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle"

// We import NavLink to utilize the react router.
import { NavLink } from "react-router-dom";
import Logo from "././Logo.png";

// Here, we display our Navbar
export default function Navbar() {
    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-light bg-light p-2">
                <NavLink className="navbar-brand" to="/">
                    <img style={{ "width": "25%" }} src={Logo} alt="Logo do IFC"></img>
                </NavLink>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/create">
                                Cadastrar Usuários
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
}