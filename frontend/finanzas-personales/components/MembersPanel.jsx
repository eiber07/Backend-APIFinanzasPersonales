"use client";

function formatMemberBalance(balance) {
  const numericBalance = Number(balance) || 0;
  const absoluteBalance = Math.abs(numericBalance);
  const formatted = absoluteBalance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (numericBalance > 0) return `+$${formatted}`;
  if (numericBalance < 0) return `-$${formatted}`;
  return `$${formatted}`;
}

function getMemberBalanceLabel(balance) {
  const numericBalance = Number(balance) || 0;
  if (numericBalance > 0) return "Saldo a favor";
  if (numericBalance < 0) return "Debe";
  return "Al día";
}

export default function MembersPanel({
  members,
  balancesByUserId,
  loading,
  currentUser,
  onAddMemberClick,
  onMemberClick,
}) {

  const currentMember = members.find(
    (m) => Number(m.user_id) === Number(currentUser?.id)
  );
  const canAddMembers = currentMember?.role === "admin";

  return (
    <aside id="members-section" className="componente-miembros">
      <div className="miembros-header">
        <h2>Miembros</h2>
        {canAddMembers && (
          <button
            type="button"
            className="btn-miembros-mas"
            aria-label="Agregar miembro"
            onClick={() => onAddMemberClick?.()}
          >
            <img src="/img/icono-mas.png" height="25" alt="" />
          </button>
        )}
      </div>

      <div className="members-list">
        {loading ? (
          <p className="members-empty">Cargando...</p>
        ) : members.length === 0 ? (
          <p className="members-empty">Aún no hay miembros cargados.</p>
        ) : (
          members.map((member) => {
            const balance = balancesByUserId.get(Number(member.user_id));
            const isCurrentUser = Number(member.user_id) === Number(currentUser?.id);

            let statusLabel = "Activo";
            if (isCurrentUser) statusLabel = "Vos";
            else if (member.role === "admin") statusLabel = "Administrador";

            return (
              <article
                key={member.user_id}
                className="member-item"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onMemberClick?.({
                    userId: member.user_id,
                    name: `${member.name} ${member.last_name}`.trim(),
                    email: member.email,
                    role: member.role,
                  })
                }
              >
                <div>
                  <p className="member-name">
                    {`${member.name} ${member.last_name}`.trim()}
                  </p>
                  <p className="member-status">{statusLabel}</p>
                </div>

                <div className="member-balance-info">
                  {balance === undefined || balance === null ? (
                    <>
                      <p className="member-balance member-balance-neutral">—</p>
                      <p className="member-balance-label">Sin calcular</p>
                    </>
                  ) : (
                    <>
                      <p
                        className={`member-balance ${
                          balance > 0
                            ? "member-balance-positive"
                            : balance < 0
                            ? "member-balance-negative"
                            : "member-balance-neutral"
                        }`}
                      >
                        {formatMemberBalance(balance)}
                      </p>
                      <p className="member-balance-label">
                        {getMemberBalanceLabel(balance)}
                      </p>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}