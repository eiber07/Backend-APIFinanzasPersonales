"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { getTokenExpiration } from "@/lib/api";

const WARNING_MARGIN_MS = 2 * 60 * 1000; // Alerta 2 minutos antes de expirar

export default function SessionTimeoutModal({ onLogout }) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const expTimeMs = getTokenExpiration();
    if (!expTimeMs) return;

    const now = Date.now();
    const timeUntilExp = expTimeMs - now;

    if (timeUntilExp <= 0) {
      onLogout();
      return;
    }

    const timeUntilWarning = timeUntilExp - WARNING_MARGIN_MS;
    let warningTimer;

    if (timeUntilWarning <= 0) {
      setShowWarning(true);
      setSecondsLeft(Math.floor(timeUntilExp / 1000));
    } else {
      warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, timeUntilWarning);
    }

    return () => clearTimeout(warningTimer);
  }, [onLogout]);

  useEffect(() => {
    const interval = setInterval(() => {
      const expTimeMs = getTokenExpiration();
      if (!expTimeMs) {
        onLogout();
        return;
      }

      const now = Date.now();
      const diffSeconds = Math.floor((expTimeMs - now) / 1000);

      if (diffSeconds <= 0) {
        clearInterval(interval);
        onLogout();
      } else {
        setSecondsLeft(diffSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onLogout]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSecs = secondsLeft % 60;
  const formattedTime = `${minutes}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;

  return (
    <Modal 
      id="modalSessionTimeout" 
      open={showWarning} 
      onClose={() => setShowWarning(false)}
    >
      <div className="status-modal-content">
        <h2 style={{ margin: "10px 0 0", color: "#1F2937" }}>
          Tu sesión expira en {formattedTime}
        </h2>
        <p className="status-modal-message">
          Por razones de seguridad, la sesión se cerrará automáticamente al agotarse el tiempo. Podés cerrar este aviso para guardar tus cambios.
        </p>

        <div className="status-modal-actions">
          <button 
            className="btn-primary btn-red" 
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </Modal>
  );
}