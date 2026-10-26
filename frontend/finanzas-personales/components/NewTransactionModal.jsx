"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useParameters } from "@/lib/hooks/useParameters";
import { createTransaction } from "@/lib/endpoints/transactions";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";
import { getCategoryTransactionType } from "@/lib/constants/transactionTypes";

export default function NewTransactionModal({
  open,
  onClose,
   accountId = [],
  isGroup = false,
   categoriesVersion = 0,
  members = [],
  currentUser,
  onCreated,
}) {
  const { showSuccess, showError } = useAlerts();
  const { options: categories } = useParameters("transactionCategories", {
    accountId,
    isGroup,
    refreshKey: categoriesVersion,
  });
  const { options: types } = useParameters("transactionTypes");

  const [typeId, setTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [performedByUserId, setPerformedByUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = types.find((t) => String(t.id) === String(typeId));
  const categoryType = getCategoryTransactionType(selectedType?.value);
  const availableCategories = categoryType
    ? categories.filter((category) => category.transactionType === categoryType)
    : [];
  const defaultPerformedByUserId = members.some(
    (member) => String(member.user_id) === String(currentUser?.id)
  )
    ? String(currentUser.id)
    : String(members[0]?.user_id ?? "");
  const selectedPerformedByUserId = members.some(
    (member) => String(member.user_id) === performedByUserId
  )
    ? performedByUserId
    : defaultPerformedByUserId;
  function resetForm() {
    setTypeId("");
    setCategoryId("");
    setAmountDigits("");
    setDate("");
    setDescription("");
    setPerformedByUserId("");
    }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleTypeChange(value) {
    setTypeId(value);
    setAmountDigits("");
    setCategoryId("");
  }

  async function handleSave() {
    if (
      !amountDigits ||
      !date ||
      !categoryId ||
      !typeId ||
      !description.trim() ||
      (isGroup && !selectedPerformedByUserId)
    ) {
      showError("Completá todos los campos antes de guardar la transacción.");
      return;
    }

    if (
      isGroup &&
      !members.some((member) => String(member.user_id) === selectedPerformedByUserId)
    ) {
      showError("Seleccioná un participante válido de la cuenta grupal.");
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
        ...(isGroup ? { user_id: Number(selectedPerformedByUserId) } : {}),
        type_id: Number(typeId),
        amount: amountNumber,
        description: description.trim(),
        category_id: Number(categoryId),
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
    <Modal id="modalNewTransax" open={open} onClose={handleClose} className="transaction-modal">
      <h2 className="transaction-modal-title">Nueva Transacción</h2>
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

        <div className="form-group">
          <label className="label">Monto</label>
          <input
            type="text"
            className="input"
            placeholder="$ 0.00"
            value={digitsToMoneyDisplay(amountDigits)}
            onChange={(e) => setAmountDigits(extractDigits(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label className="label">Fecha</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="label">Categoría</label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!categoryType}
          >
            <option value="">{categoryType ? "Seleccionar" : "Primero seleccioná un tipo"}</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentCategoryId ? `↳ ${c.label}` : c.label}
              </option>
            ))}
          </select>
        </div>

        {isGroup && (
          <div className="form-group">
            <label className="label" htmlFor="transaction-performed-by">Realizado por</label>
            <select
              id="transaction-performed-by"
              className="input"
              value={selectedPerformedByUserId}
              onChange={(e) => setPerformedByUserId(e.target.value)}
              required
            >
              <option value="">Seleccionar participante</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.name} {member.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

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
          <div style={{fontSize:"14px"}}>{description.length} / 25 caracteres</div>
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