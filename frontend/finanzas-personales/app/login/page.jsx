"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";
import { login, forgetPassword } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showSuccess } = useAlerts();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");

  async function handleLogin() {
    let valid = true;
    setErrorEmail("");
    setErrorPassword("");

    if (email.trim() === "") {
      setErrorEmail("Campo Obligatorio");
      valid = false;
    }
    if (password.trim() === "") {
      setErrorPassword("Campo Obligatorio");
      valid = false;
    }
    if (!valid) return;

    try {
      const res = await login(email.trim(), password.trim());

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const err = await res.json();
        const detail = err.detail || "No se pudo iniciar sesión.";
        const lowerDetail = detail.toLowerCase();

        // Muestra el error debajo del Email o de la Contraseña según corresponda
        if (
          lowerDetail.includes("usuario") ||
          lowerDetail.includes("email") ||
          lowerDetail.includes("registrado") ||
          lowerDetail.includes("correo")
        ) {
          setErrorEmail(detail);
        } else {
          setErrorPassword(detail);
        }
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setErrorEmail("No se pudo conectar con el servidor.");
    }
  }

  async function handleSendReset() {
    setResetError("");

    if (!resetEmail) {
      setResetError("Ingresa tu correo");
      return;
    }

    try {
      const res = await forgetPassword(resetEmail);
      const data = await res.json();

      if (res.ok) {
        closeForgot();
        showSuccess(
          "Revisa tu bandeja de entrada para restablecer la contraseña.",
          "Correo enviado"
        );
      } else {
        setResetError(data.detail || "Ocurrió un error, intenta de nuevo.");
      }
    } catch (error) {
      setResetError("No se pudo conectar con el servidor.");
    }
  }

  function closeForgot() {
    setForgotOpen(false);
    setResetEmail("");
    setResetError("");
  }

  return (
    <>
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="titles">
            <div className="app-title-group">
              <div className="logo-placeholder" title="Placeholder Logotipo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <span className="app-title">Finance tracker</span>
            </div>
            <span className="form-title">Iniciar Sesión</span>
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="text"
              className="input"
              placeholder="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errorEmail && <span className="error active">{errorEmail}</span>}
          </div>

          <div className="form-group">
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorPassword && (
              <span className="error active">{errorPassword}</span>
            )}
          </div>

          <div className="forgot">
            <button
              type="button"
              className="boton-invisible"
              onClick={() => setForgotOpen(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="button" className="btn-primary" onClick={handleLogin}>
            <span>Ingresar</span>
          </button>

          <div className="divider" />

          <p className="auth-footer-text">
            Si todavía no tienes una cuenta, puedes crear una{" "}
            <Link href="/register" className="signup">
              aquí.
            </Link>
          </p>
        </div>
      </div>

      <Modal id="modalForget" open={forgotOpen} onClose={closeForgot}>
        <h2>¿Olvidaste tu contraseña?</h2>
        <p>
          No hay de qué preocuparse, te enviaremos un enlace para
          restablecerla.
        </p>
        <div className="form-group">
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="Tu correo"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
          {resetError && (
            <span className="error active">{resetError}</span>
          )}
        </div>
        <button type="button" className="btn-primary" onClick={handleSendReset}>
          Enviar enlace
        </button>
      </Modal>
    </>
  );
}