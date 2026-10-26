"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useAlerts } from "@/components/AlertProvider";
import {
  createTransactionCategory,
  deleteTransactionCategory,
  getTransactionCategories,
  updateTransactionCategory,
} from "@/lib/endpoints/parameters";

function getAccountCategory(category, accountId, isGroup) {
  return isGroup
    ? String(category.group_id) === String(accountId)
    : String(category.account_id) === String(accountId);
}

function isStandardCategory(category) {
  return (
    category?.owner_id == null &&
    category?.group_id == null &&
    category?.account_id == null
  );
}

function categoryScopePayload(accountId, isGroup) {
  return isGroup ? { group_id: accountId } : { account_id: accountId };
}

export default function TransactionCategoriesModal({
  open,
  onClose,
  accountId,
  accountName,
  isGroup,
  onChanged,
}) {
  const { showSuccess, showError, showWarning } = useAlerts();
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory = categories.find(
    (category) => category.id === selectedId
  );
  const selectedIsStandard = isStandardCategory(selectedCategory);
  const canAddSubcategory =
    isCreating || (selectedId !== null && !selectedCategory?.parent_category_id);

  const accountCategories = useMemo(
    () =>
      categories.filter((category) => {
        const isGlobal =
          category.owner_id == null &&
          category.group_id == null &&
          category.account_id == null;
        const isUserGeneral =
          !isGroup &&
          category.owner_id != null &&
          category.group_id == null &&
          category.account_id == null;
        return (
          isGlobal ||
          isUserGeneral ||
          getAccountCategory(category, accountId, isGroup)
        );
      }),
    [accountId, categories, isGroup]
  );

  const hasRemovedSubcategories =
    selectedIsStandard &&
    accountCategories.some(
      (category) =>
        category.parent_category_id === selectedId &&
        !subcategories.some((subcategory) => subcategory.id === category.id)
    );

  const rootCategories = accountCategories.filter(
    (category) => category.parent_category_id == null
  );
  const selectableCategories = rootCategories.flatMap((category) => [
    category,
    ...accountCategories.filter(
      (item) => item.parent_category_id === category.id
    ),
  ]);

  const loadCategories = useCallback(async () => {
    if (!accountId) return false;
    setLoading(true);
    setError("");
    try {
      const response = await getTransactionCategories();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "No se pudieron cargar las categorías.");
      }
      setCategories(data);
      return true;
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las categorías.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (open) {
      void Promise.resolve().then(loadCategories);
    }
  }, [loadCategories, open]);

  function resetForm() {
    setSelectedId(null);
    setIsCreating(false);
    setName("");
    setSubcategories([]);
    setError("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSelectCategory(category) {
    setSelectedId(category.id);
    setIsCreating(false);
    setName(category.name);
    setSubcategories(
      accountCategories
        .filter((item) => item.parent_category_id === category.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          originalName: item.name,
          isStandard: isStandardCategory(item),
        }))
    );
    setError("");
  }

  function handleNewCategory() {
    setSelectedId(null);
    setIsCreating(true);
    setName("");
    setSubcategories([]);
    setError("");
  }

  function handleCategoryPickerChange(event) {
    const value = event.target.value;
    if (value === "new") {
      handleNewCategory();
      return;
    }

    const category = accountCategories.find(
      (item) => String(item.id) === value
    );
    if (category) {
      handleSelectCategory(category);
    } else {
      resetForm();
    }
  }

  function handleAddSubcategory() {
    setSubcategories((current) => [...current, { name: "" }]);
  }

  function handleSubcategoryChange(index, value) {
    setSubcategories((current) =>
      current.map((subcategory, itemIndex) =>
        itemIndex === index ? { ...subcategory, name: value } : subcategory
      )
    );
  }

  function handleRemoveSubcategory(index) {
    setSubcategories((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function readResponse(response, fallbackMessage) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || fallbackMessage);
    }
    return data;
  }

  async function handleSave(event) {
    event.preventDefault();
    const categoryName = name.trim();
    if (!categoryName) {
      setError("Ingresá un nombre para la categoría.");
      return;
    }
    if (subcategories.some((subcategory) => !subcategory.name.trim())) {
      setError("Completá el nombre de cada subcategoría o quitá el campo vacío.");
      return;
    }
    if (selectedIsStandard && categoryName !== selectedCategory.name) {
      setError("Las categorías estándar son de solo lectura.");
      return;
    }

    setSaving(true);
    setError("");
    let reconciledSubcategories = subcategories.map((child) => ({ ...child }));
    try {
      let parentId = selectedId;
      if (isCreating) {
        const created = await readResponse(
          await createTransactionCategory({
            name: categoryName,
            parent_category_id: null,
            ...categoryScopePayload(accountId, isGroup),
          }),
          "No se pudo crear la categoría."
        );
        parentId = created.id;
        setSelectedId(created.id);
        setIsCreating(false);
        setCategories((current) => [...current, created]);
      } else if (!selectedIsStandard && selectedCategory.name !== categoryName) {
        await readResponse(
          await updateTransactionCategory(selectedId, { name: categoryName }),
          "No se pudo actualizar la categoría."
        );
        setCategories((current) =>
          current.map((category) =>
            category.id === selectedId
              ? { ...category, name: categoryName }
              : category
          )
        );
      }

      const currentChildren = categories.filter(
        (category) => category.parent_category_id === parentId
      );
      const retainedIds = new Set(
        subcategories
          .filter((subcategory) => subcategory.id != null)
          .map((subcategory) => subcategory.id)
      );

      for (const child of currentChildren) {
        if (!retainedIds.has(child.id)) {
          await readResponse(
            await deleteTransactionCategory(child.id),
            `No se pudo quitar la subcategoría "${child.name}".`
          );
          setCategories((current) =>
            current.filter((category) => category.id !== child.id)
          );
        }
      }

      for (const [index, child] of subcategories.entries()) {
        const childName = child.name.trim();
        if (child.id != null) {
          if (child.name !== child.originalName) {
            const updated = await readResponse(
              await updateTransactionCategory(child.id, { name: childName }),
              `No se pudo actualizar la subcategoría "${child.originalName}".`
            );
            reconciledSubcategories[index] = {
              ...child,
              name: updated.name,
              originalName: updated.name,
              isStandard: isStandardCategory(updated),
            };
            setCategories((current) =>
              current.map((category) =>
                category.id === child.id ? updated : category
              )
            );
          }
        } else {
          const created = await readResponse(
            await createTransactionCategory({
              name: childName,
              parent_category_id: parentId,
              ...categoryScopePayload(accountId, isGroup),
            }),
            `No se pudo crear la subcategoría "${childName}".`
          );
          reconciledSubcategories[index] = {
            id: created.id,
            name: created.name,
            originalName: created.name,
            isStandard: isStandardCategory(created),
          };
          setCategories((current) => [...current, created]);
        }
      }

      const reloaded = await loadCategories();
      if (!reloaded) {
        setError("Los cambios se guardaron, pero no se pudo actualizar la lista.");
      } else {
        showSuccess("Categorías guardadas correctamente.");
        resetForm();
      }
      onChanged?.();
    } catch (saveError) {
      setSubcategories(reconciledSubcategories);
      setError(saveError.message || "No se pudieron guardar las categorías.");
      showError(saveError.message || "No se pudieron guardar las categorías.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory() {
      if (!selectedCategory || selectedIsStandard) return;

      showWarning(
        `¿Deseas eliminar la categoría "${selectedCategory.name}"?`,
        "Eliminar categoría",
        async () => {
          setSaving(true);
          setError("");
          try {
            await readResponse(
              await deleteTransactionCategory(selectedCategory.id),
              "No se pudo eliminar la categoría."
            );
            showSuccess("Categoría eliminada correctamente.");
            resetForm();
            await loadCategories();
            onChanged?.();
          } catch (deleteError) {
            setError(deleteError.message || "No se pudo eliminar la categoría.");
            showError(deleteError.message || "No se pudo eliminar la categoría.");
          } finally {
            setSaving(false);
          }
        }
      );
    }

  return (
    <Modal
      id="modalTransactionCategories"
      open={open}
      onClose={handleClose}
      className="transaction-categories-modal"
    >
      <h2 className="transaction-modal-title">Administrar categorías</h2>
      <p className="category-modal-subtitle">
        {accountName} · {isGroup ? "Cuenta grupal" : "Cuenta personal"}
      </p>

      <form className="category-manager-form" onSubmit={handleSave}>
        <div className="category-picker">
          <div className="category-picker-heading">Categorías existentes</div>
          <select
            className="input category-picker-select"
            value={isCreating ? "new" : selectedId == null ? "" : String(selectedId)}
            onChange={handleCategoryPickerChange}
            disabled={loading || saving}
            aria-label="Select an existing category"
          >
            <option value="">Select a category</option>
            {selectableCategories.map((category) => {
              const isSubcategory = category.parent_category_id != null;
              const parent = isSubcategory
                ? accountCategories.find(
                    (item) => item.id === category.parent_category_id
                  )
                : null;
              return (
                <option key={category.id} value={category.id}>
                  {isSubcategory ? `${parent?.name ?? ""} — ` : ""}
                  {category.name}
                </option>
              );
            })}
            <option value="new">New Category</option>
          </select>
        </div>

        <button
          type="button"
          className="category-add-subcategory"
          onClick={handleAddSubcategory}
          disabled={!canAddSubcategory || saving}
        >
          <span aria-hidden="true">+</span>
          Add Subcategory
        </button>

        {(selectedId !== null || isCreating) && (
          <div className="category-editor">
            <div className="form-group">
              <label className="label" htmlFor="category-name">
                Category name
              </label>
              <input
                id="category-name"
                className="input"
                value={name}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                disabled={Boolean(selectedIsStandard) || saving}
                placeholder="Enter a category name"
                autoFocus
              />
            </div>

            {subcategories.length > 0 && (
              <div className="category-subcategories">
                <h3>Subcategories</h3>
                {subcategories.map((subcategory, index) => (
                  <div className="category-subcategory-row" key={subcategory.id ?? `new-${index}`}>
                    <input
                      className="input"
                      aria-label={`Subcategory ${index + 1} name`}
                      value={subcategory.name}
                      maxLength={100}
                      onChange={(event) =>
                        handleSubcategoryChange(index, event.target.value)
                      }
                      disabled={saving}
                      placeholder="Enter a subcategory name"
                    />
                    <button
                      type="button"
                      className="category-remove-subcategory"
                      onClick={() => handleRemoveSubcategory(index)}
                      disabled={saving || subcategory.isStandard}
                      aria-label={`Remove ${subcategory.name || "subcategory"}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedIsStandard && (
              <p className="category-readonly-note">
                Standard categories are read-only.
              </p>
            )}
          </div>
        )}

        {error && <p className="category-form-error" role="alert">{error}</p>}

        <div className="category-form-actions">
          {selectedId !== null && !selectedIsStandard && (
            <button
              type="button"
              className="btn-secondary category-delete-button"
              onClick={handleDeleteCategory}
              disabled={saving}
            >
              Delete Category
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={
              saving ||
              loading ||
              (!isCreating && selectedId === null) ||
              (selectedIsStandard &&
                !subcategories.some((subcategory) => subcategory.id == null) &&
                !hasRemovedSubcategories)
            }
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
