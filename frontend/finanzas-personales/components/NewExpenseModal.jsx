"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";
import { useParameters } from "@/lib/hooks/useParameters";
import { createPlannedExpense, deactivatePlannedExpense } from "@/lib/endpoints/plannedExpenses";
import { createTransaction, deactivateTransaction } from "@/lib/endpoints/transactions";
import { TRANSACTION_TYPE_EXPENSE } from "@/lib/constants/transactionTypes";

export default function NewExpenseModal({
  open,
  onClose,
  accountId,
  isGroup = false,
  categoriesVersion = 0,
  onCreated,
}) {
  const { showSuccess, showError } = useAlerts();

  const [kind, setKind] = useState("installments");
  const [description, setDescription] = useState("");
  const [totalAmountDigits, setTotalAmountDigits] = useState("");
  const [fixedAmountDigits, setFixedAmountDigits] = useState("");
  const [installments, setInstallments] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const { options: categories } = useParameters("transactionCategories", {
    accountId,
    isGroup,
    refreshKey: categoriesVersion,
  });
  const { options: types } = useParameters("transactionTypes");
  const expenseType = types.find((t) => {
    const value = t.value?.trim().toLocaleLowerCase();
    return value === TRANSACTION_TYPE_EXPENSE;
  });
  const expenseCategories = categories.filter(
    (category) => category.transactionType === TRANSACTION_TYPE_EXPENSE
  );
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

    if (!expenseType) {
      showError("No se encontró el tipo de transacción para registrar las cuotas.");
      return;
    }

    setSaving(true);
    const createdTransactionIds = [];
    let groupId = null;

    try {
      const res = await createPlannedExpense({
        account_id: accountId,
        description: description.trim(),
        installment_amount: installmentAmount,
        installments: Number(installments),
        due_date: `${paymentDate}T00:00:00`,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.detail || "Error al guardar el pago.");
        return;
      }

      const cuotas = await res.json();
      groupId = cuotas[0]?.id_planned_expense;

      const ordered = [...cuotas].sort((a, b) => a.installment_number - b.installment_number);

      for (const cuota of ordered) {
        const txRes = await createTransaction({
          account_id: accountId,
          type_id: expenseType.id,
          amount: Number(cuota.installment_amount),
          description: description.trim(),
          category_id: Number(categoryId),
          planned_expense_id: cuota.id_planned_expense,
          planned_expense_installment_number: cuota.installment_number,
          transaction_date: `${cuota.due_date.split("T")[0]}T00:00:00`,
        });

        if (!txRes.ok) {
          const err = await txRes.json().catch(() => ({}));
          throw Object.assign(new Error("tx"), {
            userMessage: err.detail || `No se pudo registrar la cuota ${cuota.installment_number}.`,
          });
        }

        const tx = await txRes.json();
        createdTransactionIds.push(tx.id);
      }

      onCreated?.();
      handleClose();
      showSuccess("Pago guardado correctamente.");
    } catch (error) {
      await Promise.allSettled(createdTransactionIds.map((id) => deactivateTransaction(id)));
      if (groupId) await deactivatePlannedExpense(groupId).catch(() => {});
      onCreated?.();
      showError(error.userMessage || "No se pudo conectar con el servidor.");
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
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentCategoryId ? `↳ ${c.label}` : c.label}
              </option>
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