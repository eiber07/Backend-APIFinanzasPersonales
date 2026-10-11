"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function DashboardHeader({ activeAccount, onDeleteAccount, onLogout }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  function handleDelete() {
    setInfoOpen(false);
    onDeleteAccount?.();
  }

  return (
    <>
      <header className="componente-header">
        <div className="header-title-group">
          <h1>{activeAccount?.name || "Dashboard"}</h1>
          {activeAccount && (
            <img
              src="/img/icono-info.svg"
              height="25"
              alt="Información de la cuenta"
              style={{ cursor: "pointer" }}
              onClick={() => setInfoOpen(true)}
            />
          )}
        </div>

        <div className="logout-container">
          <button
            className="btn-logout-icon"
            onClick={() => setLogoutOpen(true)}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <Modal id="modalAccountInfo" open={infoOpen} onClose={() => setInfoOpen(false)}>
        <h2 style={{ color: "#1F2937", margin: 0 }}>Información de cuenta</h2>

        <table className="tabla-detalle">
          <tbody>
            <tr><td>Nombre:</td><td>{activeAccount?.name}</td></tr>
            <tr><td>Descripción:</td><td>{activeAccount?.description || "Sin descripción"}</td></tr>
            <tr>
              <td>Tipo:</td>
              <td>{activeAccount?.account_type === "personal" ? "Personal" : "Grupal"}</td>
            </tr>
          </tbody>
        </table>

        <div className="acciones-modal">
          <button className="btn-primary btn-red" onClick={handleDelete}>
            Eliminar cuenta
          </button>
          <button className="btn-secondary" onClick={() => setInfoOpen(false)}>
            Cerrar
          </button>
        </div>
      </Modal>

      <Modal id="modalLogout" open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <h2>¿Cerrar sesión?</h2>
        <p>
          ¿Estás seguro de que deseas cerrar tu sesión? Deberás iniciar sesión
          nuevamente para acceder.
        </p>
        <div className="acciones-modal">
          <button className="btn-primary btn-red" onClick={onLogout}>
            Cerrar Sesión
          </button>
          <button className="btn-secondary" onClick={() => setLogoutOpen(false)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
}