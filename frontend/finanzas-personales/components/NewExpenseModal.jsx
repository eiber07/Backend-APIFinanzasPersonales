"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { createPlannedExpense } from "@/lib/endpoints/plannedExpenses";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";
import { useParameters } from "@/lib/hooks/useParameters";

export default function NewExpenseModal({ open, onClose, accountId, onCreated }) {
  const { showSuccess, showError } = useAlerts();

  const [kind, setKind] = useState("installments"); // "installments" | "fixed"
  const [description, setDescription] = useState("");
  const [totalAmountDigits, setTotalAmountDigits] = useState("");
  const [fixedAmountDigits, setFixedAmountDigits] = useState("");
  const [installments, setInstallments] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const { options: categories } = useParameters("transactionCategories");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const totalAmount = totalAmountDigits
    ? parseTransactionAmount(digitsToMoneyDisplay(totalAmountDigits))
    : 0;

  const installmentAmount =
    kind === "fixed"
      ? fixedAmountDigits
        ? parseTransactionAmount(digitsToMoneyDisplay(fixedAmountDigits))
        : 0
      : totalAmount && Number(installments) > 0
      ? totalAmount / Number(installments)
      : 0;

  const installmentAmountDisplay = installmentAmount
    ? digitsToMoneyDisplay(String(Math.round(installmentAmount * 100)))
    : "";

  const fixedTotalDisplay =
    installmentAmount && Number(installments) > 0
      ? digitsToMoneyDisplay(String(Math.round(installmentAmount * Number(installments) * 100)))
      : "";

  function resetForm() {
    setKind("installments");
    setDescription("");
    setTotalAmountDigits("");
    setFixedAmountDigits("");
    setInstallments("");
    setPaymentDate("");
    setCategoryId("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSave() {
    const amountFilled = kind === "fixed" ? fixedAmountDigits : totalAmountDigits;

    if (!installments || !paymentDate || !description.trim() || !amountFilled || !categoryId) {
      showError("Completá todos los campos antes de guardar el pago.");
      return;
    }

    if (!installmentAmount || installmentAmount <= 0) {
      showError("El monto debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await createPlannedExpense({
      account_id: accountId,
      description: description.trim(),
      category_id: Number(categoryId),
      installment_amount: installmentAmount,
      installments: Number(installments),
      due_date: `${paymentDate}T00:00:00`,
    });
      if (res.ok) {
        showSuccess("Pago guardado correctamente.");
        onCreated?.();
        handleClose();
      } else {
        const err = await res.json();
        showError(err.detail || "Error al guardar el pago.");
      }
    } catch {
      showError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal id="modalNewExpense" open={open} onClose={handleClose}>
      <h2 style={{ margin: 0 }}>Nuevo pago</h2>

      <div className="form-section">
        <div className="segmented">
          <button
            type="button"
            className={kind === "installments" ? "active" : ""}
            onClick={() => setKind("installments")}
          >
            Compra en cuotas
          </button>
          <button
            type="button"
            className={kind === "fixed" ? "active" : ""}
            onClick={() => setKind("fixed")}
          >
            Pago fijo
          </button>
        </div>
        <p className="segmented-hint">
          {kind === "installments"
            ? "Ingresás el total y lo dividimos en cuotas iguales."
            : "El mismo monto cada mes. Ej: alquiler, suscripciones."}
        </p>

        <div className="form-group">
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={3}
            maxLength={25}
            placeholder="¿Para qué es este pago?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div style={{fontSize:"14px"}}>{description.length} / 25 caracteres</div>
        </div>
        <div className="form-group">
          <label className="label">Categoría</label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Seleccionar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {kind === "installments" ? (
          <>
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
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="label">Monto por pago</label>
              <input
                type="text"
                className="input"
                placeholder="$ 0.00"
                value={digitsToMoneyDisplay(fixedAmountDigits)}
                onChange={(e) => setFixedAmountDigits(extractDigits(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="label">Cantidad de pagos</label>
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
              <label className="label">Total a pagar</label>
              <input
                type="text"
                className="input"
                placeholder="$ 0.00"
                value={fixedTotalDisplay}
                readOnly
              />
            </div>
          </>
        )}

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
            {saving ? "Guardando..." : "Guardar pago"}
          </button>
          <button className="btn-secondary" onClick={handleClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}