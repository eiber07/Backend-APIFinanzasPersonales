"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { deactivatePlannedExpense } from "@/lib/endpoints/plannedExpenses";
import { useAlerts } from "@/components/AlertProvider";
import { deactivateTransaction } from "@/lib/endpoints/transactions";
import { todayLocal } from "@/lib/format";

export default function ExpenseDetailModal({ expense, open, onClose, onDeleted, transactions }) {
  const { showSuccess, showError } = useAlerts();
  const [deleting, setDeleting] = useState(false);
  if (!expense) return null;

  async function handleDelete() {
    if (!confirm(`¿Eliminar pago "${expense.detail}"?`)) return;
    setDeleting(true);
    try {
      const res = await deactivatePlannedExpense(expense.id);
      if (res.ok) {
        const today = todayLocal();
        const future = transactions.filter(
          (t) => t.plannedExpenseId === String(expense.id) && t.dateRaw > today
        );
        await Promise.allSettled(future.map((t) => deactivateTransaction(t.id)));
        
        onDeleted?.();
        onClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al eliminar pago.");
      }
    } catch {
      showError("No se pudo establecer conexión con el servidor.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal id="modalEditExpenses" open={open} onClose={onClose}>
      <h2 style={{ color: "#1F2937", margin: 0 }}>Detalle del pago</h2>

      <table className="tabla-detalle">
        <tbody>
          <tr><td>Detalle:</td><td>{expense.detail}</td></tr>
          <tr><td>Cantidad de pagos:</td><td>{expense.totalInstallments}</td></tr>
          <tr><td>Primer pago:</td><td>{expense.firstDueDate}</td></tr>
          <tr><td>Último pago:</td><td>{expense.lastDueDate}</td></tr>
          <tr><td>Monto por pago:</td><td>{expense.installmentAmount}</td></tr>
          <tr><td>Total:</td><td>{expense.total}</td></tr>
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