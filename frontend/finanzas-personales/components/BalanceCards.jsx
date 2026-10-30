"use client";

function formatDashboardMoney(amount) {
  const numericAmount = Number(amount) || 0;
  const absoluteAmount = Math.abs(numericAmount);
  const formatted = absoluteAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return numericAmount < 0 ? `-$${formatted}` : `$${formatted}`;
}

export default function BalanceCards({ filteredTransactions = [], loading }) {
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
      <article className="tarjeta-resumen tarjeta-resumen-grande health-balance-card">
        <div className="tarjeta-resumen-header">
          <p className="tarjeta-resumen-label">Te queda</p>
        </div>
        <h2 className="tarjeta-monto">
          {loading ? "..." : formatDashboardMoney(balanceTotal)}
        </h2>
      </article>

      <article className="tarjeta-resumen tarjeta-resumen-grande">
        <div className="tarjeta-resumen-header">
          <p className="tarjeta-resumen-label">Ingresos del Mes</p>
        </div>
        <h2 className="tarjeta-monto">
          {loading ? "..." : formatDashboardMoney(incomeTotal)}
        </h2>
      </article>

      <article className="tarjeta-resumen tarjeta-resumen-grande">
        <div className="tarjeta-resumen-header">
          <p className="tarjeta-resumen-label">Gastos del Mes</p>
        </div>
        <h2 className="tarjeta-monto">
          {loading ? "..." : formatDashboardMoney(expenseTotal)}
        </h2>
      </article>
    </section>
  );
}