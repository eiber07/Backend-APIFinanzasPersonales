"use client";

import { useGroupDebts } from "@/lib/hooks/useGroupDebts";

export default function DebtsPanel({ accountId, month, year }) {
  const { debts, loading, error } = useGroupDebts(accountId, month, year);

  return (
    <div className="debts-component" id="debts-component">
      <div className="title-section">
        <h2>Deudas entre miembros</h2>
      </div>

      <div id="debts-container" className="debts-grid">
        {loading ? (
          <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>Cargando deudas...</p>
        ) : error ? (
          <p style={{ color: "#6B7280" }}>{error}</p>
        ) : debts.length === 0 ? (
          <p style={{ color: "#6B7280" }}>No hay deudas para este período.</p>
        ) : (
          debts.map((debt, index) => (
            <div className="debts-card" key={index}>
              <div className="user-debts">
                <div className="debts-avatar">{debt.fromName.charAt(0).toUpperCase()}</div>
                <span className="debts-name">{debt.fromName}</span>
              </div>
              <div className="arrow-debts">
                <span>→</span>
                <span className="debts-ammount">{debt.amount}</span>
              </div>
              <div className="user-debts">
                <div className="debts-avatar">{debt.toName.charAt(0).toUpperCase()}</div>
                <span className="debts-name">{debt.toName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}