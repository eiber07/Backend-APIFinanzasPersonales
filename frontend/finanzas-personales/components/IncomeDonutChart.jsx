"use client";

const COLORS = [
  "rgba(20, 184, 166, 0.82)",
  "rgba(37, 99, 235, 0.82)",
  "rgba(245, 158, 11, 0.82)",
  "rgba(139, 92, 246, 0.82)",
  "rgba(6, 182, 212, 0.82)",
  "rgba(132, 204, 22, 0.82)",
  "rgba(236, 72, 153, 0.82)",
];

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function IncomeDonutChart({ categories = [], total = 0 }) {
  const sortedCategories = categories
    .filter((category) => Number(category.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount));
  const incomeTotal = Number(total) || 0;
  const gradient = sortedCategories
    .reduce(
      (segments, category, index) => {
        const start = segments.total;
        const end = start + (Number(category.amount) / incomeTotal) * 100;
        return {
          total: end,
          stops: [
            ...segments.stops,
            `${COLORS[index % COLORS.length]} ${start}% ${end}%`,
          ],
        };
      },
      { total: 0, stops: [] }
    )
    .stops.join(", ");

  return (
    <article className="health-card">
      <header className="health-card-heading">
        <div>
          <h2>Distribución de ingresos</h2>
          <p>Por naturaleza en el período seleccionado</p>
        </div>
      </header>
      {incomeTotal > 0 ? (
        <div className="donut-content">
          <div
            className="donut-chart"
            style={{ "--donut-gradient": `conic-gradient(${gradient})` }}
            role="img"
            aria-label={`Ingresos por naturaleza. Total ${formatCurrency(incomeTotal)}.`}
          >
            <div className="donut-center">
              <span>Total de ingresos</span>
              <strong>{formatCurrency(incomeTotal)}</strong>
            </div>
          </div>
          <ul className="donut-legend">
            {sortedCategories.map((category, index) => (
              <li key={category.category_id}>
                <span
                  className="donut-legend-color"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="donut-legend-name">{category.category_name}</span>
                <strong>
                  {((Number(category.amount) / incomeTotal) * 100).toFixed(1)}%
                </strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="health-empty">No hay ingresos registrados en este período.</p>
      )}
    </article>
  );
}
