"use client";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function TransactionsTable({ filteredTransactions, loading, isGroup, month, year, onRowClick, onAddClick }) {
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const colSpan = isGroup ? 5 : 4;

  return (
    <section className="componente-transacciones">
      <div className="titulo-seccion">
        <h2>Transacciones recientes</h2>
        <img
          src="/img/icono-mas.png"
          height="25"
          alt="Nueva transacción"
          style={{ cursor: "pointer" }}
          onClick={() => onAddClick?.()}
        />
      </div>

      <div className="tabla-contenedor">
        <table
          className={`tabla-transacciones ${isGroup ? "tabla-grupal" : "tabla-personal"}`}
        >
          <thead>
            <tr>
              <th className="columna-fecha">Fecha</th>
              <th className="columna-descripcion">Descripción</th>
              <th className="columna-monto">Monto</th>
              <th className="columna-categoria">Categoría</th>
              {isGroup && <th className="columna-miembro">Miembro</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="empty-transactions-row">
                <td colSpan={colSpan}>
                  <div className="empty-transactions-message">Cargando...</div>
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr className="empty-transactions-row">
                <td colSpan={colSpan}>
                  <div className="empty-transactions-message">
                    No se registraron transacciones en {periodLabel}
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="clickable-row"
                  onClick={() => onRowClick?.(t)}
                >
                  <td className="columna-fecha">{t.date}</td>
                  <td className="columna-descripcion">{t.description}</td>
                  <td className={`columna-monto ${t.amountNumber > 0 ? "monto-positivo" : ""}`}>
                    {t.amount}
                  </td>
                  <td className="columna-categoria">
                    <span className="categoria-etiqueta">{t.category}</span>
                  </td>
                  {isGroup && <td className="columna-miembro">{t.memberName}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}