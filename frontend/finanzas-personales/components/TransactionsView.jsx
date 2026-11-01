"use client";

import TransactionsTable from "@/components/TransactionsTable";
import PlannedExpensesPreview from "@/components/PlannedExpensesPreview";

export default function TransactionsView({
  filteredTransactions,
  transactionsLoading,
  isGroup,
  month,
  year,
  onRowClick,
  onAddTransaction,
  onManageCategories,
  plannedExpenses,
  plannedExpensesLoading,
  transactions,
  onNewExpense,
  onManageExpenses,
  onExpenseClick,
}) {
  return (
    <section className="componente-main2">
      <section className="componente-transacciones">
        <TransactionsTable
          filteredTransactions={filteredTransactions}
          loading={transactionsLoading}
          isGroup={isGroup}
          month={month}
          year={year}
          onRowClick={onRowClick}
          onAddClick={onAddTransaction}
          onManageCategoriesClick={onManageCategories}
        />
      </section>

      <div className="columna-derecha">
        <PlannedExpensesPreview
          plannedExpenses={plannedExpenses}
          loading={plannedExpensesLoading}
          transactions={transactions}
          isGroup={isGroup}
          month={month}
          year={year}
          onNewExpenseClick={onNewExpense}
          onManageClick={onManageExpenses}
          onCardClick={onExpenseClick}
        />
      </div>
    </section>
  );
}
