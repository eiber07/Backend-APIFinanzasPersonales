"use client";

import UserAvatar from "@/components/UserAvatar";

export default function MembersPanel({
  members,
  loading,
  currentUser,
  onAddMemberClick,
  onMemberClick,
}) {

  const currentMember = members.find(
    (m) => Number(m.user_id) === Number(currentUser?.id)
  );
  const canAddParticipants = currentMember?.role === "admin";

  return (
    <aside id="participants-section" className="componente-participantes">
      <div className="participantes-header">
        <h2>Participantes</h2>
        <div className="participants-actions">
          <button
            type="button"
            className="btn-participants-info"
            aria-label="Máximo de 7 participantes por cuenta grupal, incluyendo al administrador"
            data-tooltip="Máximo de 7 participantes por cuenta grupal, incluyendo al administrador"
          >
            <span aria-hidden="true">i</span>
          </button>
          {canAddParticipants && (
          <button
            type="button"
            className="btn-participants-add"
            aria-label="Agregar participante"
            onClick={() => onAddMemberClick?.()}
          >
            <img title="Agregar participantes" src="/img/icono-mas.png" height="25" alt="" />
          </button>
          )}
        </div>
      </div>

      <div className="participants-list" aria-busy={loading}>
        {loading ? (
          <p className="participants-empty">Cargando...</p>
        ) : members.length === 0 ? (
          <p className="participants-empty">Aún no hay participantes cargados.</p>
        ) : (
          members.map((member) => {
            return (
              <button
                type="button"
                key={member.user_id}
                className="participant-item"
                onClick={() =>
                  onMemberClick?.({
                    userId: member.user_id,
                    name: `${member.name} ${member.last_name}`.trim(),
                    email: member.email,
                    role: member.role,
                  })
                }
              >
                <UserAvatar
                  name={member.name}
                  lastName={member.last_name}
                  email={member.email}
                  size={36}
                />
                <span className="participant-name">
                  {`${member.name} ${member.last_name}`.trim()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}