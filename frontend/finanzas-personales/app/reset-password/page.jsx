"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";
import Image from "next/image";
import financeIllustration from "../../public/img/Personal Home Finance 2 (1).png";

import { isPasswordValid } from "@/lib/password";
import PasswordChecklist from "@/components/PasswordChecklist";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useAlerts();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  async function handleResetPassword() {
    let valid = true;

    setErrorPassword("");
    setErrorConfirm("");

    if (newPassword.trim() === "") {
      setErrorPassword("Campo obligatorio");
      valid = false;
    }  else if (!isPasswordValid(newPassword.trim())) {
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
            <PasswordChecklist password={newPassword} />
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

        <Image
          className="side-image"
          src={financeIllustration}
          alt="Finance illustration"
          sizes="(max-width: 1024px) 70vw, 35vw"
        />
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