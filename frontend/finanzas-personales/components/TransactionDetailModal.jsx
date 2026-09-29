"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useParameters } from "@/lib/hooks/useParameters";
import { updateTransaction, deactivateTransaction } from "@/lib/endpoints/transactions";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";

export default function TransactionDetailModal({ transaction, open, onClose, onChanged }) {
  const { showSuccess, showError } = useAlerts();
  const [mode, setMode] = useState("view");

  const { options: categories } = useParameters("transactionCategories");
  const { options: types } = useParameters("transactionTypes");

  const [amountDigits, setAmountDigits] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isLinkedToPlannedExpense = Boolean(transaction?.plannedExpenseId);

  useEffect(() => {
    if (open && transaction) {
      setMode("view");
      setDate(transaction.dateRaw || "");
      setDescription(transaction.description || "");
      setCategoryId(transaction.categoryId ? String(transaction.categoryId) : "");
      setTypeId(transaction.typeId ? String(transaction.typeId) : "");
      const abs = Math.abs(transaction.amountNumber || 0);
      setAmountDigits(String(Math.round(abs * 100)));
    }
  }, [open, transaction]);

  if (!transaction) return null;

  async function handleSave() {
    if (!amountDigits || !date || !categoryId || !typeId || !description.trim()) {
      showError("Completá todos los campos.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateTransaction({
        id: Number(transaction.id),
        type_id: Number(typeId),
        amount: parseTransactionAmount(digitsToMoneyDisplay(amountDigits)),
        description: description.trim(),
        category_id: Number(categoryId),
        transaction_date: `${date}T00:00:00`,
      });

      if (res.ok) {
        showSuccess("Transacción actualizada correctamente.");
        onChanged?.();
        onClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al actualizar la transacción.");
      }
    } catch {
      showError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isLinkedToPlannedExpense) {
      showError("No podés eliminar una transacción asociada a un gasto planificado.");
      return;
    }
    if (!confirm(`¿Eliminar la transacción #${transaction.id}?`)) return;

    try {
      const res = await deactivateTransaction(transaction.id);
      if (res.ok) {
        showSuccess("Transacción eliminada correctamente.");
        onChanged?.();
        onClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al eliminar la transacción.");
      }
    } catch {
      showError("No se pudo establecer conexión con el servidor.");
    }
  }

  return (
    <Modal id="modalTransax" open={open} onClose={onClose}>
      {mode === "view" ? (
        <>
          <h2 style={{ color: "#1F2937", margin: 0 }}>Detalle de Transacción</h2>
          <table className="tabla-detalle">
            <tbody>
              <tr><td>ID:</td><td>{transaction.id}</td></tr>
              <tr><td>Tipo:</td><td>{transaction.type}</td></tr>
              <tr><td>Categoría:</td><td>{transaction.category}</td></tr>
              <tr><td>Descripción:</td><td>{transaction.description}</td></tr>
              <tr><td>Monto:</td><td>{transaction.amount}</td></tr>
              <tr><td>Fecha:</td><td>{transaction.date}</td></tr>
            </tbody>
          </table>
          <div className="acciones-modal">
            <button className="btn-secondary" onClick={() => setMode("edit")}>
              Editar
            </button>
            <button className="btn-primary btn-red" onClick={handleDelete}>
              Eliminar
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ color: "#1F2937", margin: 0 }}>Modificar datos de Transacción</h2>
          <div className="form-section">
            <div className="form-group">
              <label className="label">Monto</label>
              <input
                type="text"
                className="input"
                placeholder="$ 0.00"
                value={digitsToMoneyDisplay(amountDigits)}
                onChange={(e) => setAmountDigits(extractDigits(e.target.value))}
                readOnly={isLinkedToPlannedExpense}
                style={isLinkedToPlannedExpense ? { background: "#D1D5DB" } : undefined}
              />
            </div>
            <div className="form-group">
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Categoría</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Seleccionar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tipo de transacción</label>
              <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                <option value="">Seleccionar</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Descripción</label>
              <textarea
                className="input"
                rows={3}
                maxLength={25}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div>{description.length} / 25 caracteres</div>
            </div>
            <div className="acciones-modal">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button className="btn-secondary" onClick={() => setMode("view")}>
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}