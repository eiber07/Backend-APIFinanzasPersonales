"use client";

export default function StatusModal({ isOpen, onClose, type = "info", title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  const handleAction = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div
      className="modal show"
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className="content-modal status-modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>

        {title && <h2>{title}</h2>}
        {message && <p className="status-modal-message">{message}</p>}

        {type === "warning" && (
          <div className="status-modal-actions">
            <button
              type="button"
              className="btn-primary btn-red"
              onClick={handleAction}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="btn-primary btn-secondary"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        )}

        {type !== "warning" && (
          <div className="status-modal-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleAction}
            >
              Aceptar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}