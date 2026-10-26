"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { showSuccess } = useAlerts();

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorName, setErrorName] = useState("");
  const [errorLastname, setErrorLastname] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  async function handleRegister() {
    let valid = true;

    setErrorName("");
    setErrorLastname("");
    setErrorEmail("");
    setErrorPassword("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.trim() === "") {
      setErrorEmail("Campo Obligatorio");
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      setErrorEmail("Formato de email inválido");
      valid = false;
    }

    if (password.trim() === "") {
      setErrorPassword("Campo Obligatorio");
      valid = false;
    } else if (password.trim().length < 6) {
      setErrorPassword("La contraseña debe tener al menos 6 caracteres");
      valid = false;
    }

    if (name.trim() === "") {
      setErrorName("Campo Obligatorio");
      valid = false;
    }

    if (lastname.trim() === "") {
      setErrorLastname("Campo Obligatorio");
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await signup({
        name: name.trim(),
        last_name: lastname.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      if (res.ok) {
        const redirectToLogin = () => router.push("/login");
        showSuccess(
          "Tu cuenta ha sido creada con éxito. Ya puedes iniciar sesión.",
          "¡Registro Exitoso!",
          redirectToLogin, // onConfirm
          redirectToLogin  // onCancel (al hacer clic afuera o en la 'X')
        );
      } else {
        const errorData = await res.json();
        const detail = errorData.detail || "No se pudo completar el registro.";
        
        // Si el mensaje del backend indica que el email ya está en uso, se asigna al campo email
        if (detail.toLowerCase().includes("email")) {
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

  return (
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
          <span className="form-title">Crear cuenta</span>
        </div>

        <div className="form-group2">
          <div>
            <label className="label">Nombre</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errorName && <span className="error active">{errorName}</span>}
          </div>
          <div>
            <label className="label">Apellido</label>
            <input
              type="text"
              className="input"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
            {errorLastname && (
              <span className="error active">{errorLastname}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input
            type="text"
            className="input"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorPassword && (
            <span className="error active">{errorPassword}</span>
          )}
        </div>

        <button className="btn-primary" onClick={handleRegister}>
          <span>Registrarse</span>
        </button>

        <div className="divider" />

        <p className="auth-footer-text">
          ¿Ya tienes una cuenta? Ingresa{" "}
          <Link href="/login" className="signup">
            aquí.
          </Link>
        </p>
      </div>
    </div>
  );
}