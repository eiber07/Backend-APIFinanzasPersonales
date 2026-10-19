"use client";

import Modal from "@/components/Modal";

export default function PlannedExpensesModal({ open, onClose, plannedExpenses = [], loading, onRowClick }) {
  return (
    <Modal
      id="modalExpenses"
      open={open}
      onClose={onClose}
      contentStyle={{ maxWidth: 800, width: "90%" }}
    >
      <h2 style={{ color: "#1F2937", margin: 0 }}>Todos los pagos</h2>

      <div className="tabla-contenedor" style={{ marginTop: "1rem" }}>
        <table className="tabla-transacciones">
          <thead>
            <tr>
              <th>Detalle</th>
              <th>Cuotas</th>
              <th>Primer pago</th>
              <th>Último pago</th>
              <th>Monto cuota</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="empty-transactions-row">
                <td colSpan={6}>
                  <div className="empty-transactions-message">Cargando...</div>
                </td>
              </tr>
            ) : plannedExpenses.length === 0 ? (
              <tr className="empty-transactions-row">
                <td colSpan={6}>
                  <div className="empty-transactions-message">
                    Aún no registraste pagos
                  </div>
                </td>
              </tr>
            ) : (
              plannedExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="clickable-row"
                  onClick={() => onRowClick?.(expense)}
                >
                  <td>{expense.detail}</td>
                  <td>{expense.totalInstallments}</td>
                  <td>{expense.firstDueDate}</td>
                  <td>{expense.lastDueDate}</td>
                  <td>{expense.installmentAmount}</td>
                  <td>{expense.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}