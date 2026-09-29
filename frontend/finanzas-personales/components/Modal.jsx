"use client";

export default function Modal({ id, open, onClose, children, className = "", contentStyle }) {
  if (!open) return null;

  return (
    <div
      id={id}
      className="modal show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`content-modal ${className}`} style={contentStyle}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        {children}
      </div>
    </div>
  );
}