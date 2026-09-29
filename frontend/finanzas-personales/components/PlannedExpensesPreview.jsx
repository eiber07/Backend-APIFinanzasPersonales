"use client";

import { usePlannedExpenses } from "@/lib/hooks/usePlannedExpenses";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function dateMatchesSelectedPeriod(dateValue, month, year) {
  if (!dateValue) return false;
  const [y, m] = String(dateValue).split("-").map(Number);
  return y === year && m === month;
}

export default function PlannedExpensesPreview({
  plannedExpenses,
  loading,
  month,
  year,
  onNewExpenseClick,
  onManageClick,
  onCardClick,
}) {
  const periodInstallments = plannedExpenses
    .flatMap((expense) =>
      expense.allInstallments
        .filter((i) => dateMatchesSelectedPeriod(i.dueDateRaw, month, year))
        .map((installment) => ({ expense, installment }))
    )
    .sort((a, b) => new Date(a.installment.dueDateRaw) - new Date(b.installment.dueDateRaw));

  return (
    <aside className="componente-cuentas">
      <div className="titulo-seccion">
        <h2>Próximas facturas</h2>
        <img
          src="/img/icono-mas.png"
          height="25"
          alt="Nuevo gasto planificado"
          style={{ cursor: "pointer" }}
          onClick={() => onNewExpenseClick?.()}
        />
      </div>

      <div className="installmentCards">
        {loading ? (
          <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>Cargando...</p>
        ) : periodInstallments.length === 0 ? (
          <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>
            No hay facturas para {MONTH_NAMES[month - 1]} {year}
          </p>
        ) : (
          periodInstallments.map(({ expense, installment }) => {
            const date = new Date(`${installment.dueDateRaw}T00:00:00`);
            const monthLabel = date
              .toLocaleDateString("es-ES", { month: "short" })
              .toUpperCase();
            const day = date.getDate();
            const paidClass = installment.statusId === 2 ? "factura-completada" : "";

            return (
              <article
                key={`${expense.id}-${installment.installmentNumber}`}
                className={`factura-card clickable-row ${paidClass}`}
                onClick={() => {
                  if (installment.statusId === 2) return;
                  onCardClick?.(expense, installment);
                }}
              >
                <div className="factura-fecha factura-fecha-gris">
                  <span>{monthLabel}</span>
                  <strong>{day}</strong>
                </div>

                <div className="factura-info">
                  <h3>{expense.detail}</h3>
                  <p>
                    Cuota {installment.installmentNumber} de {expense.totalInstallments}
                  </p>
                </div>

                <div className="factura-monto">
                  <strong>{expense.installmentAmount}</strong>
                </div>
              </article>
            );
          })
        )}
      </div>

      <button type="button" className="boton-gestionar" onClick={() => onManageClick?.()}>
        Gestionar todos los gastos
      </button>
    </aside>
  );
}