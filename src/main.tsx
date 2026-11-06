/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { LearningProvider } from "./persistence/context";
import "./styles.css";
// Static project hosting has no SPA rewrite; hashes keep refreshes on index.html.
const Router = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <LearningProvider>
        <App />
      </LearningProvider>
    </Router>
  </React.StrictMode>,
);
