import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import "./assets/css/styles.css";
import AppErrorBoundary from "./components/app-error-boundary";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const root = ReactDOM.createRoot(document.getElementById('root'));
import("./App")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to load App module:", error);
    root.render(
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>Frontend failed before render.</h1>
        <p>{error.message || "Unknown module load error."}</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
      </main>
    );
  });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
