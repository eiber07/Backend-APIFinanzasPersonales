"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addBudgetItem,
  createBudget,
  deleteBudgetItem,
  getAccountBudgets,
  updateBudgetItem,
} from "@/lib/endpoints/budgets";
import { useAlerts } from "@/components/AlertProvider";

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function readResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || fallbackMessage);
  }
  return data;
}

export default function CategoryBudgets({
  accountId,
  categories = [],
  comparisonItems = [],
  expenseCategories = [],
  onChanged,
}) {
  const { showSuccess, showError } = useAlerts();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");

  const loadBudget = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await readResponse(
        await getAccountBudgets(accountId),
        "No se pudieron cargar los presupuestos."
      );
      setBudget(data[0] || null);
    } catch (error) {
      showError(error.message || "No se pudieron cargar los presupuestos.");
    } finally {
      setLoading(false);
    }
  }, [accountId, showError]);

  useEffect(() => {
    void Promise.resolve().then(loadBudget);
  }, [loadBudget]);

  const availableCategories = useMemo(() => {
    const assignedCategoryIds = new Set(
      (budget?.items || []).map((item) => String(item.category_id))
    );
    return categories.filter(
      (category) => !assignedCategoryIds.has(String(category.id))
    );
  }, [budget, categories]);

  const actualByCategory = useMemo(() => {
    const actuals = new Map(
      expenseCategories.map((category) => [
        String(category.category_id),
        Number(category.amount) || 0,
      ])
    );
    comparisonItems.forEach((item) => {
      actuals.set(String(item.category_id), Number(item.actual_amount) || 0);
    });
    return actuals;
  }, [comparisonItems, expenseCategories]);

  async function persistChange(action, successMessage) {
    setSaving(true);
    try {
      await action();
      await loadBudget();
      onChanged?.();
      showSuccess(successMessage);
    } catch (error) {
      showError(error.message || "No se pudo guardar el presupuesto.");
    } finally {
      setSaving(false);
    }
  }

  function handleAdd(event) {
    event.preventDefault();
    const targetAmount = Number(amount);
    if (!categoryId || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      showError("Seleccioná una categoría e ingresá un monto mayor a cero.");
      return;
    }

    void persistChange(async () => {
      const item = { category_id: Number(categoryId), target_amount: targetAmount };
      if (budget) {
        await readResponse(
          await addBudgetItem(budget.id, item),
          "No se pudo agregar el presupuesto."
        );
      } else {
        const created = await readResponse(
          await createBudget({ account_id: Number(accountId), items: [item] }),
          "No se pudo crear el presupuesto."
        );
        setBudget(created);
      }
      setCategoryId("");
      setAmount("");
    }, "Presupuesto guardado correctamente.");
  }

  function handleUpdate(item) {
    const targetAmount = Number(editingAmount);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      showError("Ingresá un monto mayor a cero.");
      return;
    }

    void persistChange(async () => {
      await readResponse(
        await updateBudgetItem(budget.id, item.id, { target_amount: targetAmount }),
        "No se pudo actualizar el presupuesto."
      );
      setEditingItemId(null);
    }, "Presupuesto actualizado correctamente.");
  }

  function handleDelete(item) {
    void persistChange(async () => {
      await readResponse(
        await deleteBudgetItem(budget.id, item.id),
        "No se pudo eliminar el presupuesto."
      );
    }, "Presupuesto eliminado correctamente.");
  }

  const budgetItems = budget?.items || [];
  const budgetItemsByCategory = new Map(
    budgetItems.map((item) => [String(item.category_id), item])
  );

  return (
    <article className="health-card category-budgets">
      <header className="health-card-heading">
        <div>
          <h2>Presupuestos por categoría</h2>
          <p>Definí límites mensuales para tus categorías de gastos</p>
        </div>
      </header>

      {loading ? (
        <p className="health-empty">Cargando presupuestos...</p>
      ) : (
        <>
          {categories.length === 0 ? (
            <p className="health-empty">
              No hay categorías padre de gastos disponibles para presupuestar.
            </p>
          ) : (
            <form className="budget-create-form" onSubmit={handleAdd}>
              <label>
                <span>Categoría</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={saving || availableCategories.length === 0}
                  required
                >
                  <option value="">
                    {availableCategories.length
                      ? "Seleccionar categoría"
                      : "Todas las categorías tienen presupuesto"}
                  </option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Presupuesto mensual</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  disabled={saving}
                  required
                />
              </label>
              <button
                className="health-primary-button"
                type="submit"
                disabled={saving || availableCategories.length === 0}
              >
                Agregar presupuesto
              </button>
            </form>
          )}

          <div className="budget-list">
            {categories.map((category) => {
              const item = budgetItemsByCategory.get(String(category.id));
              const actual = actualByCategory.get(String(category.id)) || 0;

              const target = Number(item?.target_amount) || 0;
              const percentage = target > 0 ? (actual / target) * 100 : 0;
              const status =
                percentage >= 90 ? "danger" : percentage >= 70 ? "warning" : "safe";

              return (
                <section className="budget-row" key={category.id}>
                  <div className="budget-row-heading">
                    <div>
                      <h3>{category.label}</h3>
                      <p>
                        {target > 0
                          ? `Presupuesto: ${formatCurrency(target)}`
                          : "Sin presupuesto asignado"}
                        <span className="budget-spent">
                          Gastado: {formatCurrency(actual)}
                        </span>
                      </p>
                    </div>
                    {item && editingItemId !== item.id && (
                      <div className="budget-actions">
                        <button
                          type="button"
                          className="health-text-button"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditingAmount(String(item.target_amount));
                          }}
                          disabled={saving}
                        >
                          Modificar
                        </button>
                        <button
                          type="button"
                          className="health-text-button danger"
                          onClick={() => handleDelete(item)}
                          disabled={saving}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  {editingItemId === item?.id ? (
                    <div className="budget-edit-form">
                      <input
                        aria-label={`Nuevo presupuesto para ${category.label}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editingAmount}
                        onChange={(event) => setEditingAmount(event.target.value)}
                      />
                      <button
                        type="button"
                        className="health-primary-button"
                        onClick={() => handleUpdate(item)}
                        disabled={saving}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="health-secondary-button"
                        onClick={() => setEditingItemId(null)}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`budget-progress ${status}`}
                        role="progressbar"
                        aria-label={`Consumo de presupuesto para ${category.label}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(percentage, 100)}
                      >
                        <span style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                      <div className="budget-progress-label">
                        <span>
                          {target > 0 ? `${percentage.toFixed(0)}% utilizado` : "Sin límite"}
                        </span>
                        {target > 0 && percentage > 100 && (
                          <strong className="budget-over-limit">
                            Superaste el límite por {formatCurrency(actual - target)}
                          </strong>
                        )}
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}
