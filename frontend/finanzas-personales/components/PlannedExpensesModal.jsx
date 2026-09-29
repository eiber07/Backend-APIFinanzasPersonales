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
      <h2 style={{ color: "#1F2937", margin: 0 }}>Gastos Planeados</h2>

      <div className="tabla-contenedor" style={{ marginTop: "1rem" }}>
        <table className="tabla-transacciones">
          <thead>
            <tr>
              <th>Detalle</th>
              <th>Cuotas</th>
              <th>Próximo vencimiento</th>
              <th>Monto cuota</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="empty-transactions-row">
                <td colSpan={5}>
                  <div className="empty-transactions-message">Cargando...</div>
                </td>
              </tr>
            ) : plannedExpenses.length === 0 ? (
              <tr className="empty-transactions-row">
                <td colSpan={5}>
                  <div className="empty-transactions-message">
                    Aún no se han registrado gastos planeados
                  </div>
                </td>
              </tr>
            ) : (
              plannedExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className={`clickable-row ${expense.completed ? "factura-completada" : ""}`}
                  onClick={() => {
                    if (expense.completed) return;
                    onRowClick?.(expense);
                  }}
                >
                  <td>{expense.detail}</td>
                  <td>{expense.paidInstallments} de {expense.totalInstallments} cuotas</td>
                  <td>{expense.nextDueDate ?? "Completado"}</td>
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