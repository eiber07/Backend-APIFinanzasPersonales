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
          <button className="btn-logout" onClick={() => setLogoutOpen(true)}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <Modal id="modalAccountInfo" open={infoOpen} onClose={() => setInfoOpen(false)}>
        <h2 style={{ color: "#1F2937", margin: 0 }}>Información de cuenta</h2>

        <table className="tabla-detalle">
          <tbody>
            <tr><td>ID:</td><td>{activeAccount?.id}</td></tr>
            <tr><td>Nombre:</td><td>{activeAccount?.name}</td></tr>
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