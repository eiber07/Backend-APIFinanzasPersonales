"use client";

import { createContext, useCallback, useContext, useState } from "react";

const AlertsContext = createContext(null);

const ICONS = { error: "✕", success: "✓", warning: "⚠", info: "ℹ" };
const DEFAULT_DURATIONS = { error: 5000, success: 4000, warning: 5000, info: 4000 };
const DEFAULT_TITLES = { error: "Error", success: "Éxito", warning: "Advertencia", info: "Info" };

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const remove = useCallback((id) => {
    // marca "removing" para disparar la animación slideOut de tu CSS
    setAlerts((current) =>
      current.map((a) => (a.id === id ? { ...a, removing: true } : a))
    );
    setTimeout(() => {
      setAlerts((current) => current.filter((a) => a.id !== id));
    }, 300);
  }, []);

  const push = useCallback(
    (type, message, title, duration) => {
      const id = crypto.randomUUID();
      const finalDuration = duration ?? DEFAULT_DURATIONS[type];

      setAlerts((current) => [
        ...current,
        { id, type, title: title ?? DEFAULT_TITLES[type], message, removing: false },
      ]);

      if (finalDuration > 0) {
        setTimeout(() => remove(id), finalDuration);
      }
    },
    [remove]
  );

  const value = {
    showError: (message, title, duration) => push("error", message, title, duration),
    showSuccess: (message, title, duration) => push("success", message, title, duration),
    showWarning: (message, title, duration) => push("warning", message, title, duration),
    showInfo: (message, title, duration) => push("info", message, title, duration),
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
      <div id="alertsContainer" className="alerts-container">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert alert-${alert.type} ${alert.removing ? "removing" : ""}`}
          >
            <div className="alert-icon">{ICONS[alert.type]}</div>
            <div className="alert-content">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-message">{alert.message}</div>
            </div>
            <button className="alert-close" onClick={() => remove(alert.id)}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts debe usarse dentro de <AlertProvider>");
  }
  return context;
}