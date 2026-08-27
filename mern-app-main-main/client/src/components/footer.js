import React from "react";
import { NavLink } from "react-router-dom";
import Logo from "./logo.jpeg";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div className="site-footer__grid">
          {/* Marca */}
          <div className="site-footer__col">
            <div className="site-footer__brand">
              <img className="site-footer__logo" src={Logo} alt="Logo do Phytografia" />
              <span className="site-footer__brand-name">Phytografia</span>
            </div>
            <p className="site-footer__tagline">
              Sistema de Pesquisa Botânica
            </p>
          </div>

          {/* Navegação */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">Navegação</h4>
            <ul className="site-footer__nav">
              <li><NavLink className="site-footer__link" to="/inicio">Início</NavLink></li>
              <li><NavLink className="site-footer__link" to="/plantlist">Catálogo</NavLink></li>
              <li><NavLink className="site-footer__link" to="/Sobre">Sobre</NavLink></li>
              <li><NavLink className="site-footer__link" to="/favoritos">Favoritos</NavLink></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="site-footer__col">
            <h4 className="site-footer__heading">Contato</h4>
            <p className="site-footer__text">Professor Matheus Lorenzato Braga</p>
            <div className="site-footer__links">
              <a
                href="mailto:matheus.braga@ifc.edu.br"
                className="site-footer__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                E-mail
              </a>
              <a
                href="https://www.instagram.com/mathlbraga"
                className="site-footer__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/in/mathlbraga"
                className="site-footer__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__text site-footer__text--small">
            &copy; {year} Phytografia · Projeto MERN — IFC Campus Sombrio
          </p>
        </div>
      </div>
    </footer>
  );
}
