"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { removeInstallment } from "@/lib/endpoints/plannedExpenses";
import { deactivateTransaction } from "@/lib/endpoints/transactions";
import { useAlerts } from "@/components/AlertProvider";
import { todayLocal, formatTransactionMoney } from "@/lib/format";

export default function ExpenseDetailModal({ expense, open, onClose, onDeleted, transactions = [] }) {
  const { showSuccess, showError } = useAlerts();
  const [mode, setMode] = useState("view"); // "view" | "delete"
  const [selected, setSelected] = useState(new Set()); // números de cuota a eliminar
  const [deleting, setDeleting] = useState(false);

  if (!expense) return null;

  const rows = expense.allInstallments.map((inst) => ({
    ...inst,
    transaction: transactions.find(
      (t) =>
        t.plannedExpenseId === String(expense.id) &&
        t.plannedExpenseInstallmentNumber === inst.installmentNumber
    ),
  }));

  const removeAll = selected.size === rows.length;
  const remaining = rows.length - selected.size;

  function handleClose() {
    setMode("view");
    setSelected(new Set());
    onClose();
  }

  function startDelete() {
    setSelected(new Set(rows.map((r) => r.installmentNumber))); // por defecto, todas
    setMode("delete");
  }

  function toggle(n) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  function selectFromThisMonth() {
    const currentMonth = todayLocal().slice(0, 7);
    setSelected(
      new Set(
        rows
          .filter((r) => r.dueDateRaw.slice(0, 7) >= currentMonth)
          .map((r) => r.installmentNumber)
      )
    );
  }

  function summaryText() {
    if (selected.size === 0) return "Elegí al menos un pago para eliminar.";
    if (removeAll) return "Se eliminará el pago completo con todas sus transacciones.";
    return `Se eliminarán ${selected.size} de ${rows.length} pagos. El pago queda con ${remaining}, y su total pasa de ${expense.total} a ${formatTransactionMoney(
      expense.installmentAmountRaw * remaining
    )}.`;
  }

  async function handleDelete() {
    setDeleting(true);
    let failed = 0;

    // De a una y en orden: primero su transacción, después la cuota.
    // Si la transacción falla, esa cuota no se quita y el pago sigue consistente.
    for (const row of rows.filter((r) => selected.has(r.installmentNumber))) {
      try {
        if (row.transaction) {
          const txRes = await deactivateTransaction(row.transaction.id);
          if (!txRes.ok) {
            failed++;
            continue;
          }
        }
        const res = await removeInstallment(expense.id, row.installmentNumber);
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
    }

    onDeleted?.(); // refresca pagos y transacciones
    setDeleting(false);
    handleClose();

    if (failed > 0) {
      showError(`No se pudieron eliminar ${failed} pago(s). Abrí el detalle y probá de nuevo.`);
    } else {
      showSuccess(removeAll ? "Pago eliminado correctamente." : "Pagos eliminados correctamente.");
    }
  }

  return (
    <Modal id="modalEditExpenses" open={open} onClose={handleClose}>
      {mode === "view" ? (
        <>
          <h2 style={{ margin: 0 }}>Detalle del pago</h2>

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
            <button className="btn-primary btn-red" onClick={startDelete}>Eliminar</button>
            <button className="btn-secondary" onClick={handleClose}>Cerrar</button>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ margin: 0 }}>Eliminar pagos</h2>
          <p className="delete-summary">
            Elegí qué pagos de "{expense.detail}" querés eliminar.
          </p>

          <div className="delete-quick">
            <button type="button" onClick={() => setSelected(new Set(rows.map((r) => r.installmentNumber)))}>
              Todos
            </button>
            <button type="button" onClick={selectFromThisMonth}>Desde este mes</button>
            <button type="button" onClick={() => setSelected(new Set())}>Ninguno</button>
          </div>

          <div className="delete-list">
            {rows.map((r) => (
              <label key={r.installmentNumber} className="delete-item">
                <input
                  type="checkbox"
                  checked={selected.has(r.installmentNumber)}
                  onChange={() => toggle(r.installmentNumber)}
                />
                <span>{r.dueDate}</span>
                <span>{expense.installmentAmount}</span>
              </label>
            ))}
          </div>

          <p className="delete-summary">{summaryText()}</p>

          <div className="acciones-modal">
            <button
              className="btn-primary btn-red"
              onClick={handleDelete}
              disabled={deleting || selected.size === 0}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
            <button className="btn-secondary" onClick={() => setMode("view")} disabled={deleting}>
              Volver
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}