"use client";

import UserAvatar from "@/components/UserAvatar";
import { useGroupDebts } from "@/lib/hooks/useGroupDebts";

function formatDebtAmount(amount) {
  return `$${(amount / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DebtsPanel({ accountId, month, year }) {
  const { debts, loading, error } = useGroupDebts(accountId, month, year);
  const creditorTotals = new Map();

  debts.forEach((debt) => {
    const creditor = creditorTotals.get(debt.toUser.id) || {
      user: debt.toUser,
      amountInCents: 0,
    };
    creditor.amountInCents += Math.round(debt.amountValue * 100);
    creditorTotals.set(debt.toUser.id, creditor);
  });

  const creditors = [...creditorTotals.values()].sort(
    (first, second) => second.amountInCents - first.amountInCents
  );

  return (
    <div className="debts-component" id="debts-component">
      <div className="titulo-seccion debts-title">
        <h2>Deuda entre participantes</h2>
      </div>

      {loading ? (
        <p className="debts-status">Cargando deudas...</p>
      ) : error ? (
        <p className="debts-status">{error}</p>
      ) : debts.length === 0 ? (
        <p className="debts-status">No hay deudas para este período.</p>
      ) : (
        <div id="debts-container" className="debts-grid">
          {creditors.map((creditor) => (
            <article className="debts-card creditor-debt-card" key={`creditor-${creditor.user.id}`}>
              <div className="creditor-debt-identity">
                <UserAvatar
                  name={creditor.user.name}
                  lastName={creditor.user.lastName}
                  email={creditor.user.email}
                  size={40}
                />
                <div className="creditor-debt-copy">
                  <span className="creditor-debt-label">Participante acreedor</span>
                  <span className="debts-name">
                    {`${creditor.user.name} ${creditor.user.lastName}`.trim()}
                  </span>
                </div>
              </div>
              <span className="creditor-debt-amount">
                {formatDebtAmount(creditor.amountInCents)}
              </span>
            </article>
          ))}

            {debts.map((debt, index) => (
              <div className="debts-card" key={`${debt.fromUser.id}-${debt.toUser.id}-${index}`}>
                <div className="user-debts">
                  <div className="debts-avatar">
                    <UserAvatar
                      name={debt.fromUser.name}
                      lastName={debt.fromUser.lastName}
                      email={debt.fromUser.email}
                      size={40}
                    />
                  </div>
                  <span className="debts-name">
                    {`${debt.fromUser.name} ${debt.fromUser.lastName}`.trim()}
                  </span>
                </div>
                <div className="arrow-debts">
                  <span aria-hidden="true">→</span>
                  <span className="debts-ammount">{debt.amount}</span>
                </div>
                <div className="user-debts">
                  <div className="debts-avatar">
                    <UserAvatar
                      name={debt.toUser.name}
                      lastName={debt.toUser.lastName}
                      email={debt.toUser.email}
                      size={40}
                    />
                  </div>
                  <span className="debts-name">
                    {`${debt.toUser.name} ${debt.toUser.lastName}`.trim()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}