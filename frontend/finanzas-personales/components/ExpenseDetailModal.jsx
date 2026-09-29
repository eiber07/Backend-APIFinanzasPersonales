"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { deactivatePlannedExpense } from "@/lib/endpoints/plannedExpenses";
import { useAlerts } from "@/components/AlertProvider";

export default function ExpenseDetailModal({ expense, open, onClose, onDeleted }) {
  const { showSuccess, showError } = useAlerts();
  const [deleting, setDeleting] = useState(false);

  if (!expense) return null;

  async function handleDelete() {
    if (!confirm(`¿Eliminar el gasto "${expense.detail}"?`)) return;
    setDeleting(true);
    try {
      const res = await deactivatePlannedExpense(expense.id);
      if (res.ok) {
        showSuccess("Gasto eliminado correctamente.");
        onDeleted?.();
        onClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al eliminar el gasto.");
      }
    } catch {
      showError("No se pudo establecer conexión con el servidor.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal id="modalEditExpenses" open={open} onClose={onClose}>
      <h2 style={{ color: "#1F2937", margin: 0 }}>Detalle de Gasto Planeado</h2>

      <table className="tabla-detalle">
        <tbody>
          <tr><td>Detalle:</td><td>{expense.detail}</td></tr>
          <tr><td>Próximo vencimiento:</td><td>{expense.nextDueDate ?? "Completado"}</td></tr>
          <tr><td>Cuotas:</td><td>{expense.paidInstallments} de {expense.totalInstallments}</td></tr>
          <tr><td>Monto por cuota:</td><td>{expense.installmentAmount ?? "-"}</td></tr>
          <tr><td>Total:</td><td>{expense.total ?? "-"}</td></tr>
        </tbody>
      </table>

      <div className="acciones-modal">
        <button className="btn-primary btn-red" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}