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
        const paid = group.installments.filter((i) => i.statusId === 2).length;
        const nextPending = group.installments
          .filter((i) => i.statusId === 1)
          .sort((a, b) => new Date(a.dueDateRaw) - new Date(b.dueDateRaw))[0];

        return {
          id: group.id,
          detail: group.detail,
          installmentAmount: group.installmentAmount,
          installmentAmountRaw: group.installmentAmountRaw,
          totalInstallments: total,
          paidInstallments: paid,
          total: formatTransactionMoney(group.installmentAmountRaw * total),
          nextInstallment: nextPending ? nextPending.installmentNumber : null,
          nextDueDateRaw: nextPending ? nextPending.dueDateRaw : null,
          nextDueDate: nextPending ? nextPending.dueDate : null,
          allInstallments: group.installments,
          completed: paid === total,
        };
      });

      setPlannedExpenses(mapped);
    } catch (error) {
      console.error("Error cargando gastos planificados:", error);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchPlannedExpenses();
  }, [fetchPlannedExpenses]);

  return { plannedExpenses, loading, refetch: fetchPlannedExpenses };
}