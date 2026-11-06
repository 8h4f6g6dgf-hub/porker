import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { LearningProvider } from "./persistence/context";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <LearningProvider>
        <App />
      </LearningProvider>
    </HashRouter>
  </React.StrictMode>,
);
