"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";
import { login, forgetPassword } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { showSuccess } = useAlerts();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    } catch {
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
              <Image
                src="/img/3-donut-personal-dark.svg"
                alt="Finance Tracker"
                width={40}
                height={40}
              />
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
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                style={{ width: "100%", paddingRight: "40px" }}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
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