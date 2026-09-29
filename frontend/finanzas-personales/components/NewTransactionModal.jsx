"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useParameters } from "@/lib/hooks/useParameters";
import { createTransaction } from "@/lib/endpoints/transactions";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";

export default function NewTransactionModal({ open, onClose, accountId, plannedExpenses = [], onCreated }) {
  const { showSuccess, showError } = useAlerts();
  const { options: categories } = useParameters("transactionCategories");
  const { options: types } = useParameters("transactionTypes");

  const [typeId, setTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [plannedExpenseId, setPlannedExpenseId] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = types.find((t) => String(t.id) === String(typeId));
  const isPlannedExpenseType = selectedType?.value?.toLowerCase() === "gasto planificado";
  const availablePlannedExpenses = plannedExpenses.filter((e) => !e.completed);
  const selectedPlannedExpense = availablePlannedExpenses.find(
    (e) => String(e.id) === String(plannedExpenseId)
  );

  function resetForm() {
    setTypeId("");
    setCategoryId("");
    setAmountDigits("");
    setDate("");
    setDescription("");
    setPlannedExpenseId("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleTypeChange(value) {
    setTypeId(value);
    setPlannedExpenseId("");
    setAmountDigits("");
  }

  function handlePlannedExpenseChange(value) {
    setPlannedExpenseId(value);
    const exp = availablePlannedExpenses.find((e) => String(e.id) === value);
    setAmountDigits(exp ? String(Math.round(exp.installmentAmountRaw * 100)) : "");
  }

  async function handleSave() {
    if (!amountDigits || !date || !categoryId || !typeId || !description.trim()) {
      showError("Completá todos los campos antes de guardar la transacción.");
      return;
    }

    const amountNumber = parseTransactionAmount(digitsToMoneyDisplay(amountDigits));
    if (!amountNumber || amountNumber <= 0) {
      showError("Ingresá un monto válido.");
      return;
    }

    setSaving(true);
    try {
      const res = await createTransaction({
        account_id: accountId,
        type_id: Number(typeId),
        amount: amountNumber,
        description: description.trim(),
        category_id: Number(categoryId),
        planned_expense_id: plannedExpenseId ? Number(plannedExpenseId) : null,
        planned_expense_installment_number: selectedPlannedExpense?.nextInstallment ?? null,
        transaction_date: `${date}T00:00:00`,
      });

      if (res.ok) {
        showSuccess("Transacción guardada correctamente.");
        onCreated?.();
        handleClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al guardar la transacción.");
      }
    } catch {
      showError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal id="modalNewTransax" open={open} onClose={handleClose}>
      <h2 style={{ color: "#1F2937", margin: 0 }}>Nueva Transacción</h2>
      <div className="form-section">
        <div className="form-group">
          <label className="label">Tipo de transacción</label>
          <select className="input" value={typeId} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="">Seleccionar</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {isPlannedExpenseType && (
          <div className="form-group">
            <label className="label">Gasto planificado</label>
            <select
              className="input"
              value={plannedExpenseId}
              onChange={(e) => handlePlannedExpenseChange(e.target.value)}
            >
              <option value="">Ninguno</option>
              {availablePlannedExpenses.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.detail} — Cuota {exp.nextInstallment} de {exp.totalInstallments}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="label">Monto</label>
          <input
            type="text"
            className="input"
            placeholder="$ 0.00"
            value={digitsToMoneyDisplay(amountDigits)}
            onChange={(e) => setAmountDigits(extractDigits(e.target.value))}
            readOnly={Boolean(plannedExpenseId)}
            style={plannedExpenseId ? { background: "#D1D5DB" } : undefined}
          />
        </div>

        <div className="form-group">
          <label className="label">Fecha</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={3}
            maxLength={25}
            placeholder="¿Para qué era esto?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>{description.length} / 25 caracteres</div>
        </div>

        <div className="acciones-modal">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Transacción"}
          </button>
          <button className="btn-secondary" onClick={handleClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}