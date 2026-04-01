import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle";

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-4">
      <div className="container text-center">
        <p className="mb-1">MongoDB + Express + React + Node.js = MERN </p>
        <p className="mb-1">Professor Matheus Lorenzato Braga</p>
        <div className="d-flex justify-content-center gap-3">
          <a
            href="mailto:matheus.braga@ifc.edu.br"
            className="text-light"
            target="_blank"
            rel="noopener noreferrer"
          >
            E-mail
          </a>
          <a
            href="https://www.instagram.com/mathlbraga"
            className="text-light"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/in/mathlbraga"
            className="text-light"
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
