"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useAlerts();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function handleResetPassword() {
    let valid = true;

    setErrorPassword("");
    setErrorConfirm("");

    if (newPassword.trim() === "") {
      setErrorPassword("Campo obligatorio");
      valid = false;
    } else if (newPassword.trim().length < 6) {
      setErrorPassword("La contraseña debe tener al menos 6 caracteres");
      valid = false;
    }

    if (confirmPassword.trim() === "") {
      setErrorConfirm("Campo obligatorio");
      valid = false;
    } else if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorConfirm("Las contraseñas no coinciden");
      valid = false;
    }

    if (!valid) return;

    const token = searchParams.get("token");

    try {
      const res = await resetPassword({
        secretToken: token,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      const data = await res.json();

      if (res.ok) {
        setShowConfirmation(true);
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      } else {
        const message = data.detail || "Ocurrió un error.";
        setErrorConfirm(message);
        showError(message);
      }
    } catch (error) {
      const message = "No se pudo conectar con el servidor.";
      setErrorConfirm(message);
      showError(message);
    }
  }

  return (
    <div className="container">
      <div className="content">
        <div className="form-section">
          <div className="titles">
            <span className="app-title">Finance tracker</span>
            <span className="form-title">Restablecer contraseña</span>
          </div>

          <div className="form-group">
            <label className="label">Nueva contraseña</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {errorPassword && (
              <span className="error active">{errorPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label className="label">Confirmar contraseña</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errorConfirm && (
              <span className="error active">{errorConfirm}</span>
            )}
          </div>

          <button className="btn-primary" onClick={handleResetPassword}>
            <span>Guardar nueva contraseña</span>
          </button>

          <div className="divider" />

          <p>
            Volver a{" "}
            <Link href="/login" className="signup">
              login.
            </Link>
          </p>
        </div>

        <img
          className="side-image"
          src="/img/Personal Home Finance 2 (1).png"
          alt="Finance illustration"
        />
      </div>

      {showConfirmation && (
        <div className="modal show">
          <div className="content-modal" style={{ textAlign: "center" }}>
            <img src="/img/logo-OK.png" height={100} alt="" />
            <h2>Contraseña actualizada</h2>
            <p>Te estamos redirigiendo para iniciar sesión.</p>
          </div>
        </div>
      )}
    </div>
  );
}