"use client";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PeriodFilter({ month, year, onChange, extraYears = [] }) {
  const currentYear = new Date().getFullYear();

  // Rango base: 5 años atrás, 5 años adelante (igual que el original)
  const years = new Set();
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    years.add(y);
  }

  // Permite que quien use el filtro sume años "fuera de rango"
  // (ej: una transacción vieja de 2018) sin que PeriodFilter tenga
  // que conocer las transacciones ni los gastos planificados.
  extraYears.forEach((y) => {
    if (y) years.add(Number(y));
  });

  // Aseguro que el año seleccionado siempre aparezca, aunque esté fuera de rango
  years.add(year);

  const orderedYears = [...years].sort((a, b) => b - a);

  return (
    <div className="filtro-periodo">
      <select
        id="filter-month"
        className="select-periodo"
        aria-label="Filtrar por mes"
        value={month}
        onChange={(e) => onChange(Number(e.target.value), year)}
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={index + 1} value={index + 1}>
            {name}
          </option>
        ))}
      </select>

      <select
        id="filter-year"
        className="select-periodo select-periodo-year"
        aria-label="Filtrar por año"
        value={year}
        onChange={(e) => onChange(month, Number(e.target.value))}
      >
        {orderedYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}