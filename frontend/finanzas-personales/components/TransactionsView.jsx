"use client";

import DebtsPanel from "@/components/DebtsPanel";
import TransactionsTable from "@/components/TransactionsTable";
import PlannedExpensesPreview from "@/components/PlannedExpensesPreview";

export default function TransactionsView({
  filteredTransactions,
  transactionsLoading,
  isGroup,
  accountId,
  month,
  year,
  onRowClick,
  onAddTransaction,
  onManageCategories,
  plannedExpenses,
  plannedExpensesLoading,
  onNewExpense,
  onManageExpenses,
  onExpenseClick,
}) {
  return (
    <>
      {isGroup && <DebtsPanel accountId={accountId} month={month} year={year} />}

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

        <div className={`columna-derecha ${isGroup ? "cuenta-grupal" : ""}`}>
          <PlannedExpensesPreview
            plannedExpenses={plannedExpenses}
            loading={plannedExpensesLoading}
            month={month}
            year={year}
            onNewExpenseClick={onNewExpense}
            onManageClick={onManageExpenses}
            onCardClick={onExpenseClick}
          />
        </div>
      </section>
    </>
  );
}
