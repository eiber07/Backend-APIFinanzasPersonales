"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import StatusModal from "@/components/StatusModal";

const AlertsContext = createContext(null);

export function AlertProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const push = useCallback((type, message, title, onConfirm, onCancel) => {
    const defaultTitles = {
      error: "Error",
      success: "¡Éxito!",
      warning: "Advertencia",
      info: "Información",
    };

    setModalState({
      isOpen: true,
      type,
      title: title || defaultTitles[type],
      message,
      onConfirm: onConfirm || null,
      onCancel: onCancel || null,
    });
  }, []);

  const showError = useCallback(
    (message, title, onConfirm, onCancel) => push("error", message, title, onConfirm, onCancel),
    [push]
  );
  const showSuccess = useCallback(
    (message, title, onConfirm, onCancel) => push("success", message, title, onConfirm, onCancel),
    [push]
  );
  const showWarning = useCallback(
    (message, title, onConfirm, onCancel) => push("warning", message, title, onConfirm, onCancel),
    [push]
  );
  const showInfo = useCallback(
    (message, title, onConfirm, onCancel) => push("info", message, title, onConfirm, onCancel),
    [push]
  );
  const value = useMemo(
    () => ({ showError, showSuccess, showWarning, showInfo }),
    [showError, showInfo, showSuccess, showWarning]
  );

  return (
    <AlertsContext.Provider value={value}>
      {children}
      <StatusModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
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