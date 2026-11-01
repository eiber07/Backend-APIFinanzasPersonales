"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/endpoints/auth";
import { useAlerts } from "@/components/AlertProvider";
import { isPasswordValid } from "@/lib/password";
import  PasswordChecklist from "@/components/PasswordChecklist";
import Image from "next/image";

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
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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