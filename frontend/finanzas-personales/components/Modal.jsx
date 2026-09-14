"use client";

export default function Modal({ open, onClose, children, className = "" }) {
  if (!open) return null;

  return (
    <div
      className="modal show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`content-modal ${className}`}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        {children}
      </div>
    </div>
  );
}