"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { addMember } from "@/lib/endpoints/members";
import { useAlerts } from "@/components/AlertProvider";

export default function AddMemberModal({ open, onClose, accountId, onAdded }) {
  const { showSuccess } = useAlerts();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setEmail("");
    setError("");
    onClose();
  }

  async function handleSave() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Ingresá un correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const res = await addMember(accountId, trimmedEmail);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || "No se pudo agregar el miembro.");
        return;
      }

      onAdded?.();
      showSuccess("Miembro agregado correctamente.");
      handleClose();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal id="modalMembers" open={open} onClose={handleClose} className="content-modal-members">
      <h2 style={{ color: "#1F2937", margin: 0 }}>Agregar miembro</h2>

      <div className="form-section form-members">
        <div className="form-group">
          <label className="label" htmlFor="member-email">
            Correo electrónico del usuario registrado
          </label>
          <input
            type="email"
            id="member-email"
            className="input"
            placeholder="ejemplo@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <span className="error active">{error}</span>}
        </div>

        <div className="acciones-modal member-modal-actions">
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Agregando..." : "Agregar miembro"}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}