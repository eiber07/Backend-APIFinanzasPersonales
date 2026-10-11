"use client";

import PeriodFilter from "@/components/PeriodFilter";
import { useTransactions } from "@/lib/hooks/useTransactions";

function formatDashboardMoney(amount) {
  const numericAmount = Number(amount) || 0;
  const absoluteAmount = Math.abs(numericAmount);
  const formatted = absoluteAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return numericAmount < 0 ? `-$${formatted}` : `$${formatted}`;
}

export default function BalanceCards({ filteredTransactions, loading, month, year, onPeriodChange }) {
  let incomeTotal = 0;
  let expenseTotal = 0;

  filteredTransactions.forEach((t) => {
    const amount = Number(t.amountNumber) || 0;
    if (amount > 0) incomeTotal += amount;
    else expenseTotal += Math.abs(amount);
  });

  const balanceTotal = incomeTotal - expenseTotal;

  return (
    <section className="componente-tarjetas">
      <article className="componente-tarjetas1">
        <div className="tarjeta-info tarjeta-balance-info">
          <div className="tarjeta-balance-encabezado">
            <p className="tarjeta-titulo">Balance total</p>
            <PeriodFilter month={month} year={year} onChange={onPeriodChange} />
          </div>
          <h2 className="tarjeta-monto">
            {loading ? "..." : formatDashboardMoney(balanceTotal)}
          </h2>
        </div>
      </article>

      <article className="tarjeta-resumen tarjeta-resumen-grande">
          <div className="tarjeta-resumen-header">
            <div className="tarjeta-resumen-icono ingreso">↗</div>
            <p className="tarjeta-resumen-label">Ingreso total</p>
          </div>
          <h2 className="tarjeta-monto">
            {loading ? "..." : formatDashboardMoney(incomeTotal)}
          </h2>
      </article>

      <article className="tarjeta-resumen tarjeta-resumen-grande">
        <div className="tarjeta-resumen-header">
          <div className="tarjeta-resumen-icono egreso">↘</div>
          <p className="tarjeta-resumen-label">Egreso total</p>
        </div>
        <h2 className="tarjeta-monto">
          {loading ? "..." : formatDashboardMoney(expenseTotal)}
        </h2>
      </article>
    </section>
  );
}