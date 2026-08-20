import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle";
import "./index.css";

const storedTheme = window.localStorage.getItem("phyto-theme");
const initialTheme = storedTheme === "dark" || storedTheme === "light"
  ? storedTheme
  : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

document.documentElement.dataset.theme = initialTheme;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
