"use client";

function formatDashboardMoney(amount) {
  const numericAmount = Number(amount) || 0;
  return `$${Math.abs(numericAmount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function BalanceCards({ filteredTransactions = [], loading }) {
  let expenseTotal = 0;

  filteredTransactions.forEach((t) => {
    const amount = Number(t.amountNumber) || 0;
    if (amount < 0) expenseTotal += Math.abs(amount);
  });

  return (
    <section className="componente-tarjetas">
      <article className="tarjeta-resumen tarjeta-resumen-grande health-balance-card">
        <div className="tarjeta-resumen-header">
          <p className="tarjeta-resumen-label">Total de Gastos del Mes</p>
        </div>
        <h2 className="tarjeta-monto">
          {loading ? "..." : formatDashboardMoney(expenseTotal)}
        </h2>
      </article>
    </section>
  );
}