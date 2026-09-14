"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";
import { apiFetch, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

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
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password.trim());

      const res = await apiFetch("/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        router.push("/dashboard");
      } else {
        const err = await res.json();
        alert("Error: " + err.detail);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor.");
    }
  }

  async function handleSendReset() {
    setResetError("");

    if (!resetEmail) {
      setResetError("Ingresa tu correo");
      return;
    }

    try {
      const res = await apiFetch("/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetSent(true);
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
    setResetSent(false);
  }

  return (
    <>
      <div id="alertsContainer" className="alerts-container" />

      <div className="content">
        <div className="form-section">
          <div className="titles">
            <span className="app-title">Finance tracker</span>
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
              className="boton-invisible"
              onClick={() => setForgotOpen(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button className="btn-primary" onClick={handleLogin}>
            <span>Ingresar</span>
          </button>

          <div className="divider" />

          <p>
            Si todavía no tienes una cuenta, puedes crear una{" "}
            <Link href="/register" className="signup">
              aquí.
            </Link>
          </p>
        </div>

        <img
          className="side-image"
          src="/img/Personal Home Finance 2 (1).png"
          alt="Finance illustration"
        />
      </div>

      <Modal open={forgotOpen} onClose={closeForgot}>
        {!resetSent ? (
          <>
            <h2>¿Olvidaste tu contraseña?</h2>
            <p>
              No hay de qué preocuparse, te enviaremos un enlace para
              restablecerla.
            </p>
            <div className="form-group">
              <label>Email</label>
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
            <button className="btn-primary" onClick={handleSendReset}>
              Enviar enlace
            </button>
            <div style={{ textAlign: "left", width: "100%" }}>
              Regístrate{" "}
              <Link href="/register" className="signup">
                aquí
              </Link>
              .
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <img src="/img/logo-OK.png" height={100} alt="" />
            <h2>Correo enviado</h2>
            <p>Revisa tu bandeja de entrada y actualiza tu contraseña.</p>
          </div>
        )}
      </Modal>
    </>
  );
}