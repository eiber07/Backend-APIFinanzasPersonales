"use client";

import { useCallback, useEffect, useState } from "react";
import { getParameters } from "@/lib/endpoints/parameters";

function formatParameterLabel(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function useParameters(type, { accountId, isGroup, refreshKey } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getParameters(type);
      if (!res.ok) return;
      const data = await res.json();
      setOptions(
        data.result.map((p) => ({
          id: p.id,
          value: p.value,
          label: formatParameterLabel(p.value),
          transactionType: p.transaction_type ?? null,
          parentCategoryId: p.parent_category_id ?? null,
          ownerId: p.owner_id ?? null,
          groupId: p.group_id ?? null,
          accountId: p.account_id ?? null,
        }))
      );
    } catch (error) {
      console.error("Error cargando parámetros:", error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void Promise.resolve().then(fetchParams);
  }, [fetchParams, refreshKey]);

  const scopedOptions =
    type !== "transactionCategories" || !accountId
      ? options
      : options.filter((category) => {
          const isGlobal =
            category.ownerId === null &&
            category.groupId === null &&
            category.accountId === null;
          return (
            isGlobal ||
            (isGroup
              ? String(category.groupId) === String(accountId)
              : String(category.accountId) === String(accountId)) ||
            (category.ownerId !== null &&
              category.groupId === null &&
              category.accountId === null &&
              !isGroup)
          );
        });

  return { options: scopedOptions, loading };
}