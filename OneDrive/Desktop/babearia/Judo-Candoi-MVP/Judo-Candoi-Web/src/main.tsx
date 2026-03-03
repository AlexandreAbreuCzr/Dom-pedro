import React from "react";
import ReactDOM from "react-dom/client";
import AdminApp from "./AdminApp";
import App from "./App";

const queryParams = new URLSearchParams(window.location.search);
const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isAdminRoute = queryParams.get("admin") === "1" || normalizedPath === "/admin";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </React.StrictMode>
);
