"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";
import Image from "next/image";

import { isPasswordValid } from "@/lib/password";
import PasswordChecklist from "@/components/PasswordChecklist";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useAlerts();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  async function handleResetPassword() {
    let valid = true;

    setErrorPassword("");
    setErrorConfirm("");

    if (newPassword.trim() === "") {
      setErrorPassword("Campo obligatorio");
      valid = false;
    } else if (!isPasswordValid(newPassword.trim())) {
      setErrorPassword("La contraseña no cumple los requisitos.");
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
        showSuccess(
          "Tu contraseña ha sido actualizada correctamente.",
          "Contraseña actualizada",
          () => {
            router.push("/login");
          }
        );
      } else {
        const message = data.detail || "Ocurrió un error.";
        setErrorConfirm(message);
        showError(message);
      }
    } catch {
      const message = "No se pudo conectar con el servidor.";
      setErrorConfirm(message);
      showError(message);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="titles">
          <div className="app-title-group">
            <Image
              src="/img/3-donut-personal-dark.svg"
              alt="Finance Tracker"
              width={40}
              height={40}
            />
            <span className="app-title">Finance tracker</span>
          </div>
          <span className="form-title">
            Restablecer contraseña
          </span>
        </div>

        <div className="form-group">
          <label className="label">Nueva contraseña</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showNewPassword ? "text" : "password"}
              className="input"
              style={{ width: "100%", paddingRight: "40px" }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#6b7280",
              }}
            >
              {showNewPassword ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          <PasswordChecklist password={newPassword} />
          {errorPassword && (
            <span className="error active">{errorPassword}</span>
          )}
        </div>

        <div className="form-group">
          <label className="label">Confirmar contraseña</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="input"
              style={{ width: "100%", paddingRight: "40px" }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#6b7280",
              }}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {errorConfirm && (
            <span className="error active">{errorConfirm}</span>
          )}
        </div>

        <button className="btn-primary" onClick={handleResetPassword}>
          <span>Guardar nueva contraseña</span>
        </button>

        <div className="divider" />

        <p className="auth-footer-text">
          Volver a{" "}
          <Link href="/login" className="signup">
            login.
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}