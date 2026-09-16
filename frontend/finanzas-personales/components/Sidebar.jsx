"use client";

import { useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import Modal from "@/components/Modal";

export default function Sidebar({
  user,
  accounts = [],
  activeAccountId,
  onSelectAccount,
  onAccountCreated,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountDescription, setAccountDescription] = useState("");
  const [accountType, setAccountType] = useState("personal");
  const [errorName, setErrorName] = useState("");
  const [saving, setSaving] = useState(false);

  // Personal primero, igual que en el original (loadUserAccounts)
  const orderedAccounts = [...accounts].sort((a, b) => {
    const aPersonal = String(a.account_type || "").toLowerCase() === "personal";
    const bPersonal = String(b.account_type || "").toLowerCase() === "personal";
    return Number(bPersonal) - Number(aPersonal);
  });

  function closeNewAccount() {
    setNewAccountOpen(false);
    setAccountName("");
    setAccountDescription("");
    setAccountType("personal");
    setErrorName("");
  }

  async function handleCreateAccount() {
    if (!accountName.trim()) {
      setErrorName("Ingresá un nombre para la cuenta.");
      return;
    }

    const accountTypeId = accountType === "personal" ? 1 : 2;
    setSaving(true);

    try {
      const res = await fetchWithAuth("/accounts/", {
        method: "POST",
        body: JSON.stringify({
          name: accountName.trim(),
          description: accountDescription.trim(),
          account_type_id: accountTypeId,
        }),
      });

      if (res.ok) {
        closeNewAccount();
        onAccountCreated?.(); // el dashboard vuelve a pedir las cuentas
      } else {
        const err = await res.json();
        setErrorName(err.detail || "No se pudo crear la cuenta.");
      }
    } catch (error) {
      setErrorName("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        &#9776;
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className={`sidebar ${mobileOpen ? "open" : ""}`} id="sidebar">
        <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
          &times;
        </button>

        <div
          className="profile"
          onClick={() => setProfileOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="cont-profile" style={{ padding: 0 }} />
          <div className="profile-info">
            <p style={{ color: "#131B2E", fontSize: 14 }}>
              {user ? `${user.name} ${user.last_name}` : ""}
            </p>
            <p style={{ color: "#737B8B", fontSize: 13 }}>{user?.email}</p>
          </div>
        </div>

        <div className="menu">
          <div className="menu-item-dashboard">
            <img src="/img/icono-dashboard.png" height="17" alt="" />
            Dashboards
          </div>

          <div className="submenu">
            {orderedAccounts.map((account) => (
              <div
                key={account.id}
                className={`account-item ${
                  account.id === activeAccountId ? "active" : ""
                }`}
                onClick={() => onSelectAccount?.(account)}
              >
                {account.name}
              </div>
            ))}

            <div className="new-account" onClick={() => setNewAccountOpen(true)}>
              + Nueva cuenta
            </div>
          </div>
        </div>
      </div>

      <Modal id="modalNewAccount" open={newAccountOpen} onClose={closeNewAccount}>
        <h2 style={{ color: "#1F2937", margin: 0 }}>Crear Cuenta</h2>
        <div className="form-section">
          <div className="form-group">
            <label className="label">Nombre de la cuenta</label>
            <input
              type="text"
              className="input"
              placeholder="Japón 2027"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            {errorName && <span className="error active">{errorName}</span>}
          </div>

          <div className="form-group">
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={3}
              maxLength={25}
              placeholder="¿Para qué sera la cuenta?"
              value={accountDescription}
              onChange={(e) => setAccountDescription(e.target.value)}
            />
            <div style={{ color: accountDescription.length >= 25 ? "#dc2626" : "inherit" }}>
              {accountDescription.length} / 25 caracteres
            </div>
          </div>

          <div className="form-group">
            <label className="label">Tipo de cuenta</label>
            <select
              className="input"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="grupal">Grupal</option>
            </select>
          </div>

          <div className="acciones-modal">
            <button
              className="btn-primary"
              onClick={handleCreateAccount}
              disabled={saving}
            >
              {saving ? "Creando..." : "Crear cuenta"}
            </button>
            <button className="btn-secondary" onClick={closeNewAccount}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        id="modalUserProfile"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      >
        <h2 style={{ color: "#1F2937", margin: 0 }}>Mi perfil</h2>

        <div className="profile-avatar-section">
          <div className="cont-profile cont-profile-lg" />
        </div>

        <table className="tabla-detalle">
          <tbody>
            <tr><td>Nombre:</td><td>{user?.name}</td></tr>
            <tr><td>Apellido:</td><td>{user?.last_name}</td></tr>
            <tr><td>Email:</td><td>{user?.email}</td></tr>
          </tbody>
        </table>
      </Modal>
    </>
  );
}