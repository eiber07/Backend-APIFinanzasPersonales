"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { deleteMember } from "@/lib/endpoints/members";
import { useAlerts } from "@/components/AlertProvider";

export default function MemberInfoModal({ member, open, onClose, accountId, onDeleted }) {
  const { showSuccess, showError } = useAlerts();
  const [deleting, setDeleting] = useState(false);

  if (!member) return null;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await deleteMember(accountId, member.userId);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.detail || "No se pudo eliminar el miembro.");
        return;
      }

      showSuccess("Miembro eliminado correctamente.");
      onDeleted?.();
      onClose();
    } catch {
      showError("No se pudo conectar con el servidor.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal id="modalMemberInfo" open={open} onClose={onClose}>
      <h2 style={{ color: "#1F2937", margin: 0 }}>Información del miembro</h2>

      <table className="tabla-detalle">
        <tbody>
          <tr><td>Nombre:</td><td>{member.name}</td></tr>
          <tr><td>Email:</td><td>{member.email}</td></tr>
          <tr><td>Estado:</td><td>{member.role}</td></tr>
        </tbody>
      </table>

      <div className="acciones-modal">
        <button className="btn-primary btn-red" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Eliminando..." : "Eliminar miembro"}
        </button>
        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}