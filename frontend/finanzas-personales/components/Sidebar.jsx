"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { createAccount } from "@/lib/endpoints/accounts";
import { useAlerts } from "@/components/AlertProvider";
import UserAvatar from "@/components/UserAvatar";
import Image from "next/image";
import dashboardIcon from "../public/img/icono-dashboard.png";

import { forgetPassword } from "@/lib/endpoints/auth";
import { maskEmail } from "@/lib/format";

export default function Sidebar({
  user,
  accounts = [],
  activeAccountId,
  onSelectAccount,
  onAccountCreated,
  mobileOpen,
  onClose,
}) {
  const { showError } = useAlerts();

  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountDescription, setAccountDescription] = useState("");
  const [accountType, setAccountType] = useState("personal");
  const [errorName, setErrorName] = useState("");
  const [saving, setSaving] = useState(false);

  const orderedAccounts = [...accounts].sort((a, b) => {
    const aPersonal = String(a.account_type || "").toLowerCase() === "personal";
    const bPersonal = String(b.account_type || "").toLowerCase() === "personal";
    return Number(bPersonal) - Number(aPersonal);
  });

  const [sendingReset, setSendingReset] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const t = setTimeout(() => setResetCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCooldown]);

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
      const res = await createAccount({
        name: accountName.trim(),
        description: accountDescription.trim(),
        accountTypeId,
      });

      if (res.ok) {
        closeNewAccount();
        onAccountCreated?.();
      } else {
        const err = await res.json();
        const message = err.detail || "No se pudo crear la cuenta.";
        setErrorName(message);
        showError(message);
      }
    } catch {
      const message = "No se pudo conectar con el servidor.";
      setErrorName(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }
  
  async function handleSendResetLink() {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const res = await forgetPassword(user.email);
      if (res.ok) {
        showSuccess(`Te enviamos un enlace a ${maskEmail(user.email)}. Revisá tu bandeja de entrada.`);
        setResetCooldown(60);
      } else {
        const err = await res.json().catch(() => ({}));
        showError(err.detail || "No se pudo enviar el enlace.");
      }
    } catch {
      showError("No se pudo conectar con el servidor.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
        onClick={onClose}
      />

      <div className={`sidebar ${mobileOpen ? "open" : ""}`} id="sidebar">
        <button className="sidebar-close" onClick={onClose}>
          &times;
        </button>


        <div
          className="profile"
          onClick={() => setProfileOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <UserAvatar name={user?.name} lastName={user?.last_name} email={user?.email} />
          <div className="profile-info">
            <p style={{ color: "#131B2E", fontSize: 14, fontWeight: 700, margin: 0 }}>
              {user ? `${user.name} ${user.last_name}` : ""}
            </p>
            <p style={{ color: "#737B8B", fontSize: 12, margin: "2px 0 0" }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div className="menu">
          <p className="menu-section-title">Cuentas</p>

          <div className="submenu" data-tour="accounts">
            {orderedAccounts.map((account) => (
              <div
                key={account.id}
                className={`account-item ${account.id === activeAccountId ? "active" : ""}`}
                onClick={() => onSelectAccount?.(account)}
              >
                {account.name}
              </div>
            ))}

            <div className="new-account" data-tour="new-account" onClick={() => setNewAccountOpen(true)}>
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
            <div style={{ color: accountDescription.length >= 25 ? "#dc2626" : "inherit" , fontSize:"14px"}}>
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
          <UserAvatar
            name={user?.name}
            lastName={user?.last_name}
            email={user?.email}
            size={72}
          />
        </div>

        <table className="tabla-detalle">
          <tbody>
            <tr><td>Nombre:</td><td>{user?.name}</td></tr>
            <tr><td>Apellido:</td><td>{user?.last_name}</td></tr>
            <tr><td>Email:</td><td>{user?.email}</td></tr>
          </tbody>
        </table>

        <div className="profile-security-section">
          <button
            className="btn-secondary"
            onClick={handleSendResetLink}
            disabled={sendingReset || resetCooldown > 0}
          >
            {sendingReset
              ? "Enviando..."
              : resetCooldown > 0
              ? `Reenviar enlace en ${resetCooldown}s`
              : "Enviar enlace de recuperación"}
          </button>
          <p className="profile-hint">
            Te enviaremos un correo con las instrucciones para crear una nueva contraseña.
          </p>
        </div>
      </Modal>
    </>
  );
}