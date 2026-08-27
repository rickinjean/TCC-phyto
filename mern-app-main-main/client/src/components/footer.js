import React from "react";



export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <p className="site-footer__text site-footer__text--strong">
          MongoDB + Express + React + Node.js = MERN
        </p>
        <p className="site-footer__text">
          Professor Matheus Lorenzato Braga
        </p>
        <p className="site-footer__text site-footer__text--small">
          &copy; {new Date().getFullYear()} Phytografia
        </p>

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
    </footer>
  );
}
