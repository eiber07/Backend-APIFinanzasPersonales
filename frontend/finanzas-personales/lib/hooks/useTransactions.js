"use client";

import { useCallback, useEffect, useState } from "react";
import { getTransactions } from "@/lib/endpoints/transactions";

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

export function useTransactions(accountId, month, year) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);

    try {
      const res = await getTransactions(accountId);
      if (!res.ok) return;

      const data = await res.json();

      const mapped = data.map((t) => ({
        id: t.id.toString(),
        type: t.type,
        typeId: t.type_id,
        category: t.category,
        categoryId: t.category_id,
        description: t.description,
        memberId: t.user_id ?? null,
        memberName: t.user_name || "Sin asignar",
        dateRaw: t.transaction_date.split("T")[0],
        amountNumber:
          t.type === "ingreso" ? parseFloat(t.amount) : parseFloat(t.amount) * -1,
        amount: `${t.type === "ingreso" ? "+" : "-"}${formatTransactionMoney(
          parseFloat(t.amount)
        )}`,
        plannedExpenseId: t.planned_expense_id
          ? t.planned_expense_id.toString()
          : null,
        date: formatTransactionDate(t.transaction_date.split("T")[0]),
      }));

      setTransactions(mapped);
    } catch (error) {
      console.error("Error cargando transacciones:", error);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((t) => {
    if (!t.dateRaw) return false;
    const [y, m] = t.dateRaw.split("-").map(Number);
    return y === year && m === month;
  });

  return { transactions, filteredTransactions, loading, refetch: fetchTransactions };
}