"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlannedExpenses } from "@/lib/endpoints/plannedExpenses";

function formatTransactionMoney(amount) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTransactionDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function usePlannedExpenses(accountId) {
  const [plannedExpenses, setPlannedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlannedExpenses = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);

    try {
      const res = await getPlannedExpenses(accountId);
      if (!res.ok) return;

      const expenses = await res.json();
      const grouped = {};

      expenses.forEach((e) => {
        if (e.status_id !== 1) return;
        const groupId = e.id_planned_expense;
        if (!grouped[groupId]) {
          grouped[groupId] = {
            id: groupId.toString(),
            detail: e.description,
            installmentAmount: formatTransactionMoney(parseFloat(e.installment_amount)),
            installmentAmountRaw: parseFloat(e.installment_amount),
            installments: [],
          };
        }
        grouped[groupId].installments.push({
          installmentNumber: e.installment_number,
          dueDateRaw: e.due_date.split("T")[0],
          dueDate: formatTransactionDate(e.due_date.split("T")[0]),
          statusId: e.status_id,
        });
      });

    const mapped = Object.values(grouped).map((group) => {
      const total = group.installments.length;
      const sorted = [...group.installments].sort((a, b) =>
        a.dueDateRaw.localeCompare(b.dueDateRaw)
      );

      return {
        id: group.id,
        detail: group.detail,
        installmentAmount: group.installmentAmount,
        installmentAmountRaw: group.installmentAmountRaw,
        totalInstallments: total,
        total: formatTransactionMoney(group.installmentAmountRaw * total),
        firstDueDate: sorted[0].dueDate,
        lastDueDate: sorted[total - 1].dueDate,
        allInstallments: group.installments,
      };
    });
      setPlannedExpenses(mapped);
    } catch (error) {
      console.error("Error cargando el pago", error);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchPlannedExpenses();
  }, [fetchPlannedExpenses]);

  return { plannedExpenses, loading, refetch: fetchPlannedExpenses };
}