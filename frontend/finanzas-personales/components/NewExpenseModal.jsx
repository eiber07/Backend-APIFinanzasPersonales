"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { createPlannedExpense } from "@/lib/endpoints/plannedExpenses";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";

export default function NewExpenseModal({ open, onClose, accountId, onCreated }) {
  const { showSuccess, showError } = useAlerts();

  const [description, setDescription] = useState("");
  const [totalAmountDigits, setTotalAmountDigits] = useState("");
  const [installments, setInstallments] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [saving, setSaving] = useState(false);

  const totalAmount = totalAmountDigits
    ? parseTransactionAmount(digitsToMoneyDisplay(totalAmountDigits))
    : 0;
  const installmentAmount =
    totalAmount && Number(installments) > 0 ? totalAmount / Number(installments) : 0;
  const installmentAmountDisplay = installmentAmount
    ? digitsToMoneyDisplay(String(Math.round(installmentAmount * 100)))
    : "";

  function resetForm() {
    setDescription("");
    setTotalAmountDigits("");
    setInstallments("");
    setPaymentDate("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSave() {
    if (!installments || !paymentDate || !description.trim() || !totalAmountDigits) {
      showError("Completá todos los campos antes de guardar el gasto.");
      return;
    }

    if (!installmentAmount || installmentAmount <= 0) {
      showError("El monto por cuota debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await createPlannedExpense({
        account_id: accountId,
        description: description.trim(),
        installment_amount: installmentAmount,
        installments: Number(installments),
        due_date: `${paymentDate}T00:00:00`,
      });

      if (res.ok) {
        showSuccess("Gasto planificado guardado correctamente.");
        onCreated?.();
        handleClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al guardar el gasto.");
      }
    } catch {
      showError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal id="modalNewExpense" open={open} onClose={handleClose}>
      <h2 style={{ color: "#1F2937", margin: 0 }}>Nuevo Gasto Planeado</h2>
      <div className="form-section">
        <div className="form-group">
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={3}
            maxLength={25}
            placeholder="¿Para qué es este gasto?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>{description.length} / 25 caracteres</div>
        </div>

        <div className="form-group">
          <label className="label">Monto total</label>
          <input
            type="text"
            className="input"
            placeholder="$ 0.00"
            value={digitsToMoneyDisplay(totalAmountDigits)}
            onChange={(e) => setTotalAmountDigits(extractDigits(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="label">Cantidad de cuotas</label>
          <input
            type="number"
            className="input"
            placeholder="Ej: 12"
            min={1}
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label">Monto por cuota</label>
          <input
            type="text"
            className="input"
            placeholder="$ 0.00"
            value={installmentAmountDisplay}
            readOnly
            style={{ background: "#D1D5DB" }}
          />
        </div>

        <div className="form-group">
          <label className="label">Fecha de primer pago</label>
          <input
            type="date"
            className="input"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div className="acciones-modal">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Gasto"}
          </button>
          <button className="btn-secondary" onClick={handleClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}