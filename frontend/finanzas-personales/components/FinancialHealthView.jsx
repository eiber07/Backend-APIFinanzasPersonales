"use client";

import { useEffect, useState } from "react";
import { useAlerts } from "@/components/AlertProvider";
import BalanceCards from "@/components/BalanceCards";
import ExpenseDonutChart from "@/components/ExpenseDonutChart";
import IncomeDonutChart from "@/components/IncomeDonutChart";
import CategoryBudgets from "@/components/CategoryBudgets";
import { getMonthlyDashboard } from "@/lib/endpoints/budgets";
import { useParameters } from "@/lib/hooks/useParameters";

export default function FinancialHealthView({
  accountId,
  isGroup,
  month,
  year,
  filteredTransactions,
  categoriesVersion,
  refreshKey,
  onBudgetChanged,
}) {
  const { showError } = useAlerts();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    options: categoryOptions,
    loading: categoriesLoading,
  } = useParameters("transactionCategories", {
    accountId,
    isGroup,
    refreshKey: categoriesVersion,
  });

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      setLoading(true);
      try {
        const response = await getMonthlyDashboard(accountId, year, month);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || "No se pudo cargar el resumen financiero.");
        }
        if (active) setDashboard(data);
      } catch (error) {
        if (active) {
          setDashboard(null);
          showError(error.message || "No se pudo cargar el resumen financiero.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (accountId) void loadDashboard();
    return () => {
      active = false;
    };
  }, [accountId, month, year, refreshKey, showError]);

  const expenseTransactionCount = filteredTransactions.filter(
    (transaction) => Number(transaction.amountNumber) < 0
  ).length;
  const expenseCategories = (dashboard?.real_expenses?.by_category || []).map(
    (category) => ({
      ...category,
      amount: Number(category.amount) || 0,
    })
  );
  const incomeCategories = (dashboard?.real_income?.by_category || []).map(
    (category) => ({
      ...category,
      amount: Number(category.amount) || 0,
    })
  );
  const rootExpenseCategories = categoryOptions.filter(
    (category) =>
      category.transactionType === "egreso" && category.parentCategoryId == null
  );

  return (
    <section className="financial-health-view" aria-busy={loading}>
      {loading ? (
        <div className="health-loading">Cargando salud financiera...</div>
      ) : (
        <>
          <BalanceCards
            filteredTransactions={filteredTransactions}
            loading={loading}
          />
          <div className="health-charts-grid">
            <ExpenseDonutChart
              categories={expenseCategories}
              total={dashboard?.real_expenses?.total}
              count={expenseTransactionCount}
            />
            <IncomeDonutChart
              categories={incomeCategories}
              total={dashboard?.real_income?.total}
            />
          </div>
          {!categoriesLoading && (
            <CategoryBudgets
              accountId={accountId}
              categories={rootExpenseCategories}
              comparisonItems={dashboard?.budget_vs_real?.items || []}
              expenseCategories={expenseCategories}
              onChanged={onBudgetChanged}
            />
          )}
        </>
      )}
    </section>
  );
}
