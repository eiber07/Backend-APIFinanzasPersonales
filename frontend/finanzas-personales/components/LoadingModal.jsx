"use client";

export default function LoadingModal({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="loading-modal-overlay">
      <div className="loading-modal-card">
        <div className="loading-spinner" />
        <span className="loading-text">Actualizando información...</span>
      </div>
    </div>
  );
}