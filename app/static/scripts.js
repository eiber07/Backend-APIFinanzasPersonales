fetch('sidebar.html')
        .then(r => {
            console.log('Status:', r.status, 'URL:', r.url);
            return r.text();
        })
        .then(html => {
            document.getElementById('sidebar-placeholder').innerHTML = html;
            console.log('Sidebar cargado OK');
        })
        .catch(err => console.error('Error:', err));


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

async function sendReset() {
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
            document.getElementById("viewForm").style.display = "none";
            document.getElementById("viewConfir").style.display = "block";
        } else {
            error.textContent = data.detail || "Ocurrió un error, intenta de nuevo.";
            error.classList.add("active");
        }
    } catch (e) {
    error.textContent = "No se pudo conectar con el servidor.";
    error.classList.add("active");
    }
}

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
                document.getElementById("modalConfirmation").classList.add("mostrar");
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

/* MODALS */
const ModalManager = (() => {
    /* lógica de limpieza o reset específica de cada modal, sin tocar el núcleo.  */
    const hooks = {
        modalForget: {
            onClose() {
                document.getElementById("reset-email").value = "";
                const err = document.getElementById("error-reset");
                err.textContent = "";
                err.classList.remove("active");
                document.getElementById("viewForm").style.display = "block";
                document.getElementById("viewConfir").style.display = "none";
            }
        },
        modalTransax: {
        onClose() {
            document.getElementById("data-id").textContent      = "";
            document.getElementById("data-type").textContent = "";
            document.getElementById("data-category").textContent = "";
            document.getElementById("data-description").textContent = "";    
            document.getElementById("data-amount").textContent   = "";
            document.getElementById("data-date").textContent   = "";
        }
        },modalEnvioConfir: {
            onClose() {}
        },
        modalConfirmation: {
            onClose() {}
        }
};
    /* abrir/cerrar*/
    function open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add("show");
    }

    function close(modalOrId) {
        const modal = typeof modalOrId === "string"
            ? document.getElementById(modalOrId)
            : modalOrId;

        if (!modal) return;
        modal.classList.remove("show");
        hooks[modal.id]?.onClose?.();
    }

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("close")) {
            close(e.target.closest(".modal"));
        }
        if (e.target.classList.contains("modal")) {
            close(e.target);
        }
    });

    return { open, close };
})();


document.getElementById("openModal")
    ?.addEventListener("click", () => ModalManager.open("modalForget"));

    const btnEdit   = document.getElementById("btnEdit");
    const btnDelete = document.getElementById("btnDelete");
    const MODAL_TX    = "modalTransax";

    document.querySelectorAll(".fila-cliqueable").forEach(fila => {
        fila.addEventListener("click", () => {
            const {id, type, category, description, amount, date} = fila.dataset;
            document.getElementById("data-id").textContent      = id;
            document.getElementById("data-type").textContent = type;
            document.getElementById("data-category").textContent = category;
            document.getElementById("data-description").textContent = description;    
            document.getElementById("data-amount").textContent   = amount;
            document.getElementById("data-date").textContent   = date;
            btnEdit.dataset.id   = id;
            btnDelete.dataset.id = id;

            ModalManager.open(MODAL_TX);
        });
    });

    btnDelete?.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm(`¿Eliminar la transacción #${id}?`)) return;

        try {
            const res = await fetch(`http://localhost:8000/transactions/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                ModalManager.close(MODAL_TX);
                document.querySelector(`.fila-cliqueable[data-id="${id}"]`)?.remove();
            } else {
                const err = await res.json();
                alert("Error: " + err.detail);
            }
        } catch {
            alert("No se pudo establecer conexión con el servidor.");
        }
    });

    btnEdit?.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        console.log("Modificar transacción ID:", id);
        // Disparar lógica de formulario de edición aquí
    });
