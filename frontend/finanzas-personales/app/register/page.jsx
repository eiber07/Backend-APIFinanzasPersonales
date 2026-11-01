"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";
import { isPasswordValid } from "@/lib/password";
import PasswordChecklist from "@/components/PasswordChecklist";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();   
  const { showSuccess } = useAlerts();

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    } else if (!isPasswordValid(password.trim())) {
      setErrorPassword("La contraseña no cumple los requisitos.");
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
          redirectToLogin,
          redirectToLogin
        );
      } else {
        const errorData = await res.json();
        const detail = errorData.detail || "No se pudo completar el registro.";

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
            <Image
              src="/img/3-donut-personal-dark.svg"
              alt="Finance Tracker"
              width={40}
              height={40}
            />
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
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input"
              style={{ width: "100%", paddingRight: "40px" }}
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
          <PasswordChecklist password={password} />
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