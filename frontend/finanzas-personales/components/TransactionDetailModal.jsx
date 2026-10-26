"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useParameters } from "@/lib/hooks/useParameters";
import { updateTransaction, deactivateTransaction } from "@/lib/endpoints/transactions";
import { useAlerts } from "@/components/AlertProvider";
import { extractDigits, digitsToMoneyDisplay, parseTransactionAmount } from "@/lib/format";

export default function TransactionDetailModal({
  transaction,
  open,
  onClose,
  onChanged,
  onOpenPlan,
  hasActivePlan = false,
  accountId,
  isGroup = false,
  categoriesVersion = 0,
}) {
  const { showSuccess, showError, showWarning } = useAlerts();
  const [mode, setMode] = useState("view");

  const { options: categories } = useParameters("transactionCategories", {
    accountId,
    isGroup,
    refreshKey: categoriesVersion,
  });
  const { options: types } = useParameters("transactionTypes");

  const [amountDigits, setAmountDigits] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isLinkedToPlannedExpense =
    Boolean(transaction?.plannedExpenseId) && hasActivePlan;

  function startEdit() {
    if (!transaction) return;

    setDate(
      transaction.dateRaw ||
      transaction.transaction_date?.split("T")[0] ||
      ""
    );

    setDescription(transaction.description || "");

    const categoryRaw = String(transaction.category || "")
      .trim().toLowerCase();
    const directCatId =
      transaction.category_id ?? transaction.categoryId;

    const foundCategory =
      categories.find(c => String(c.id) === String(directCatId)) ||
      categories.find(c =>
        String(c.label || c.name || "").trim().toLowerCase() === categoryRaw
      );

    setCategoryId(
      foundCategory
        ? String(foundCategory.id)
        : directCatId != null ? String(directCatId) : ""
    );

    const typeRaw = String(transaction.type || "")
      .trim().toLowerCase();
    const directTypeId =
      transaction.type_id ??
      transaction.typeId ??
      transaction.type?.id;

    const foundType =
      types.find(t => String(t.id) === String(directTypeId)) ||
      types.find(t =>
        String(t.label || t.name || t.value || "")
          .trim().toLowerCase() === typeRaw
      );

    setTypeId(
      foundType
        ? String(foundType.id)
        : directTypeId != null ? String(directTypeId) : ""
    );

    const abs = Math.abs(
      transaction.amountNumber || transaction.amount || 0
    );

    setAmountDigits(String(Math.round(abs * 100)));
    setMode("edit");
  }

  if (!transaction) return null;

  async function handleSave(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!amountDigits || !date || !categoryId || !typeId || !description.trim()) {
      showError("Completá todos los campos.");
      return;
    }

    const amountNumber = parseTransactionAmount(digitsToMoneyDisplay(amountDigits));
    if (!amountNumber || amountNumber <= 0) {
      showError("Ingresá un monto válido.");
      return;
    }

    if (amountNumber >= 100000000000) {
      showError("El monto ingresado es demasiado grande (máximo $99.999.999.999,99).");
      return;
    }

    setSaving(true);
    try {
      const res = await updateTransaction({
        id: Number(transaction.id),
        type_id: Number(typeId),
        amount: amountNumber,
        description: description.trim(),
        category_id: Number(categoryId),
        transaction_date: `${date}T00:00:00`,
      });

      if (res.ok) {
        showSuccess("Transacción actualizada correctamente.");
        onChanged?.();
        handleCloseModal();
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

  function handleCloseModal() {
    setMode("view");
    onClose();
  }

  function handleDelete() {
    if (isLinkedToPlannedExpense) {
      showError("No podés eliminar una transacción asociada a un gasto planificado.");
      return;
    }

    showWarning(
      `¿Estás seguro de que querés eliminar la transacción "${transaction.description}"?`,
      "Confirmar eliminación",
      async () => {
        try {
          const res = await deactivateTransaction(transaction.id);
          if (res.ok) {
            showSuccess("Transacción eliminada correctamente.");
            onChanged?.();
            handleCloseModal();
          } else {
            const err = await res.json();
            showError(err.detail || "Error al eliminar la transacción.");
          }
        } catch {
          showError("No se pudo establecer conexión con el servidor.");
        }
      },
      () => {}
    );
  }

  return (
    <Modal id="modalTransax" open={open} onClose={handleCloseModal}>
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
            <button
              type="button"
              className="btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startEdit();
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className="btn-primary btn-red"
              onClick={handleDelete}
            >
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
              <select
                className="input"
                value={String(categoryId)}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Seleccionar</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.parentCategoryId ? `↳ ${c.label}` : c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tipo de transacción</label>
              <select
                className="input"
                value={String(typeId)}
                onChange={(e) => setTypeId(e.target.value)}
              >
                <option value="">Seleccionar</option>
                {types.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.label || t.name}
                  </option>
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
              <div style={{ fontSize: "14px" }}>{description.length} / 25 caracteres</div>
            </div>
            <div className="acciones-modal">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMode("view");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}