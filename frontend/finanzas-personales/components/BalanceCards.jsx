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
    <aside className="card-balance-vertical">
      {/* Sección Principal: Balance Total */}
      <div className="balance-main-section">
        <div className="tarjeta-resumen-header">
          <div className="tarjeta-resumen-icono balance">↔</div>
          <p className="tarjeta-resumen-label">Balance total</p>
        </div>
        <h2 className="tarjeta-monto balance-principal">
          {loading ? "..." : formatDashboardMoney(balanceTotal)}
        </h2>
      </div>

      <div className="balance-divider" />

      {/* Sección Secundaria: Ingreso y Egreso */}
      <div className="balance-secondary-section">
        <div className="balance-subitem">
          <div className="tarjeta-resumen-header">
            <div className="tarjeta-resumen-icono ingreso subicono">↗</div>
            <p className="tarjeta-resumen-label sublabel">Ingreso total</p>
          </div>
          <span className="balance-submonto ingreso">
            {loading ? "..." : formatDashboardMoney(incomeTotal)}
          </span>
        </div>

        <div className="balance-subitem">
          <div className="tarjeta-resumen-header">
            <div className="tarjeta-resumen-icono egreso subicono">↘</div>
            <p className="tarjeta-resumen-label sublabel">Egreso total</p>
          </div>
          <span className="balance-submonto egreso">
            {loading ? "..." : formatDashboardMoney(expenseTotal)}
          </span>
        </div>
      </div>
    </aside>
  );
}