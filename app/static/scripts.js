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
            const response = await fetch("http://localhost:8000/auth/singup", {
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