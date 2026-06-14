async function validateForm() {
    const name = document.getElementById("name");
    const lastname = document.getElementById("lastname");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const errorEmail = document.getElementById("error-email");
    const errorPassword = document.getElementById("error-password");
    const errorName = document.getElementById("error-name");
    const errorLastname = document.getElementById("error-lastname");

    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value.trim() === "") {
        errorEmail.textContent = "Campo Obligatorio";
        errorEmail.classList.add("active");
        valid = false;
    } else if (!emailRegex.test(email.value.trim())) {
        errorEmail.textContent = "Formato de email inválido";
        errorEmail.classList.add("active");
        valid = false;
    } else {
        errorEmail.classList.remove("active");
    }

    if (password.value.trim() === "") {
        errorPassword.textContent = "Campo Obligatorio";
        errorPassword.classList.add("active");
        valid = false;
    } else if (password.value.trim().length < 6) {
        errorPassword.textContent = "La contraseña debe tener al menos 6 caracteres";
        errorPassword.classList.add("active");
        valid = false;
    } else {
        errorPassword.classList.remove("active");
    }

    if (name.value.trim() === "") {
        errorName.textContent = "Campo Obligatorio";
        errorName.classList.add("active");
        valid = false;
    } else {
        errorName.textContent = "";
        errorName.classList.remove("active");
    }

    if (lastname.value.trim() === "") {
        errorLastname.textContent = "Campo Obligatorio";
        errorLastname.classList.add("active");
        valid = false;
    } else {
        errorLastname.textContent = "";
        errorLastname.classList.remove("active");
    }

    if (valid) {
        const data = {
            name: name.value.trim(),          
            last_name: lastname.value.trim(),
            email: email.value.trim(),
            password: password.value.trim()
        };

        try {
            const response = await fetch("http://localhost:8000/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert("Registro exitoso!");
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.detail);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }
}
async function login() {
    const email = document.getElementById("email").value.trim();   
    const password = document.getElementById("password").value.trim();
    const errorEmail = document.getElementById("error-email");
    const errorPassword = document.getElementById("error-password");

    let valid = true;

    if (email === "") {
        errorEmail.textContent = "Campo Obligatorio";
        errorEmail.classList.add("active");
        valid = false;
    } else {
        errorEmail.classList.remove("active");
    }

    if (password === "") {
        errorPassword.textContent = "Campo Obligatorio";
        errorPassword.classList.add("active");
        valid = false;
    } else {
        errorPassword.classList.remove("active");
    }

    if (valid) {
        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                window.location.href = "dash_priv.html";
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.detail);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }
}
/*MODALS*/
const modal = document.getElementById("modalOlvidar");
const abrir = document.getElementById("abrirModal");
const cerrar = document.getElementById("cerrarModal");

function cerrarModal() {
    modal.classList.remove("mostrar");
    document.getElementById("reset-email").value = "";
    const errorReset = document.getElementById("error-reset");
    errorReset.textContent = "";
    errorReset.classList.remove("active");
    // Resetear vistas
    document.getElementById("vistaForm").style.display = "block";
    document.getElementById("vistaConfir").style.display = "none";
}

cerrar.addEventListener("click", cerrarModal);

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        cerrarModal();
    }
});

abrir.addEventListener("click", () => {
    modal.classList.add("mostrar");
});

async function enviarReset() {
const email = document.getElementById("reset-email").value;
const error = document.getElementById("error-reset");

    if (!email) {
        error.textContent = "Ingresa tu correo";
        error.classList.add("active");
        return
}
    try{
        const response = await fetch("http://localhost:8000/auth/forget-password",{
            method : "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email:email})
        });
        const data = await response.json();

        if (response.ok){
            document.getElementById("vistaForm").style.display = "none";
            document.getElementById("vistaConfir").style.display = "block";
        } else {
            error.textContent = data.detail || "Ocurrió un error, intenta de nuevo.";
            error.classList.add("active");
        }
    } catch (e) {
    error.textContent = "No se pudo conectar con el servidor.";
    error.classList.add("active");
    }
}


const modalConfir = document.getElementById("modalEnvioConfir");
const cerrarConfir = document.getElementById("cerrarModalConfir");

cerrarConfir.addEventListener("click", () => {
    modalConfir.classList.remove("mostrar");
});

window.addEventListener("click", (e) => {
    if (e.target === modalConfir) {
        modalConfir.classList.remove("mostrar");
}
});

async function resetPassword() {
    const newPassword = document.getElementById("new-password").value.trim();
    const confirmPassword = document.getElementById("new-password-confirm").value.trim();
    const errorPassword = document.getElementById("error-password");
    const errorEmail = document.getElementById("error-email");

    let valid = true;

    if (newPassword === "") {
        errorEmail.textContent = "Campo obligatorio";
        errorEmail.classList.add("active");
        valid = false;
    } else if (newPassword.length < 6) {
        errorEmail.textContent = "La contraseña debe tener al menos 6 caracteres";
        errorEmail.classList.add("active");
        valid = false;
    } else {
        errorEmail.classList.remove("active");
    }

    if (confirmPassword === "") {
        errorPassword.textContent = "Campo obligatorio";
        errorPassword.classList.add("active");
        valid = false;
    } else if (newPassword !== confirmPassword) {
        errorPassword.textContent = "Las contraseñas no coinciden";
        errorPassword.classList.add("active");
        valid = false;
    } else {
        errorPassword.classList.remove("active");
    }

    if (valid) {
        const token = new URLSearchParams(window.location.search).get("token");

        try {
            const response = await fetch("http://localhost:8000/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    secret_token: token,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById("modalConfirmacion").classList.add("mostrar");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2500);
            } else {
                errorPassword.textContent = data.detail || "Ocurrió un error.";
                errorPassword.classList.add("active");
            }
        } catch (e) {
            errorPassword.textContent = "No se pudo conectar con el servidor.";
            errorPassword.classList.add("active");
        }
    }
}   
