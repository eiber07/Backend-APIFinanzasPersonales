/* DATOS DE BACKEND */
// Helper para requests autenticados
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access_token");
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers
        }
    });
}

async function loadCurrentUser() {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
        window.location.href = "/app/templates/login.html";
        return null;
    }

    try {
        const res = await fetchWithAuth("http://localhost:8000/users/me");
        
        if (res.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/app/templates/login.html";
            return null;
        }

        const user = await res.json();
        return user;
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Listeners de modales - siempre se registran en cualquier página
    document.getElementById("clickable-img")
        ?.addEventListener("click", () => ModalManager.open("modalNewTransax"));
    document.getElementById("btn-save-new-transactions")
        ?.addEventListener("click", saveNewTransaction);
    renderRecentTransactions();
    document.getElementById("clickable-img2")
        ?.addEventListener("click", () => ModalManager.open("modalNewExpense"));
    document.getElementById("openModal")
        ?.addEventListener("click", () => ModalManager.open("modalForget"));

    // Contadores - siempre se registran
    const textarea  = document.getElementById('description-text');
    const counter   = document.getElementById('char-counter');
    const textarea2 = document.getElementById('description-text-exp');
    const counter2  = document.getElementById('char-counter-exp');
    const textarea3 = document.getElementById('account-description');
    const counter3  = document.getElementById('char-counter3');

    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            const l = textarea.value.length;
            counter.textContent = `${l} / 25 caracteres`;
            counter.style.color = l >= 25 ? '#dc2626' : 'inherit';
        });
    }
    if (textarea2 && counter2) {
        textarea2.addEventListener('input', () => {
            const l = textarea2.value.length;
            counter2.textContent = `${l} / 25 caracteres`;
            counter2.style.color = l >= 25 ? '#dc2626' : 'inherit';
        });
    }
    if (textarea3 && counter3) {
        textarea3.addEventListener('input', () => {
            const l = textarea3.value.length;
            counter3.textContent = `${l} / 25 caracteres`;
            counter3.style.color = l >= 25 ? '#dc2626' : 'inherit';
        });
    }

    // Solo en páginas con sidebar (dash_priv, etc.)
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (!sidebarPlaceholder) return;

    // Cargar sidebar
    try {
        const sidebarHTML = await fetch('/app/templates/sidebar.html').then(r => r.text());
        sidebarPlaceholder.innerHTML = sidebarHTML;
    } catch (err) {
        console.error("Error cargando sidebar:", err);
    }
    document.getElementById("btnNewAccount")
        ?.addEventListener("click", () => ModalManager.open("modalNewAccount"));
    // Cargar usuario
    const user = await loadCurrentUser();
    if (user) {
        const elName  = document.getElementById("user-name");
        const elEmail = document.getElementById("user-email");
        if (elName)  elName.textContent  = `${user.name} ${user.last_name}`;
        if (elEmail) elEmail.textContent = user.email;
        await loadUserAccounts(user.id);
    }
});

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
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);
            const response = await fetch("http://localhost:8000/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData
        });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access_token", data.access_token); //aqui se guarda el token
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
        },modalNewTransax:{
            onClose() {
            document.getElementById("amount").value = "";
            document.getElementById("date").value = "";
            document.getElementById("category-drop").value = "";
            document.getElementById("description-text").value = "";
            const counter = document.getElementById("char-counter");
                    counter.textContent = "0 / 25 caracteres";
                    counter.style.color = "inherit"

        }
        },modalNewExpense:{
            onClose() {
            document.getElementById("amount-exp").value = "";
            document.getElementById("start-date-exp").value = "";
            document.getElementById("due-date-exp").value = "";
            document.getElementById("installment-number-exp").value = "";
            document.getElementById("installment-amount-exp").value = "";
            document.getElementById("description-text-exp").value = "";
            const counter2 = document.getElementById("char-counter-exp");
            counter2.textContent = "0 / 25 caracteres";
            counter2.style.color = "inherit";

        }
        },modalNewAccount:{
            onClose() {
            document.getElementById("account-name").value = "";
            document.getElementById("account-description").value = "";
            const counter3 = document.getElementById("char-counter3");
            counter3.textContent = "0 / 25 caracteres";
            counter3.style.color = "inherit";

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

const btnEdit   = document.getElementById("btnEdit");
const btnDelete = document.getElementById("btnDelete");
const MODAL_TX    = "modalTransax";

/*document.querySelectorAll(".clickable-row").forEach(row => {
    row.addEventListener("click", () => {
        const {id, type, category, description, amount, date} = row.dataset;
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
}); */
document.getElementById("transactions-table-body")?.addEventListener("click", (event) => {
    const row = event.target.closest(".clickable-row");

    if (!row) return;
        const {id, type, category, description, amount, date} = row.dataset;
        document.getElementById("data-id").textContent      = id;
        document.getElementById("data-type").textContent = type;
        document.getElementById("data-category").textContent = category;
        document.getElementById("data-description").textContent = description;    
        document.getElementById("data-amount").textContent   = amount;
        document.getElementById("data-date").textContent   = date;
        if (btnEdit) btnEdit.dataset.id = id;
        if (btnDelete) btnDelete.dataset.id = id;

        ModalManager.open(MODAL_TX);
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
            document.querySelector(`.clickable-row[data-id="${id}"]`)?.remove();
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
    /*console.log("Modificar transacción ID:", id);*/
    ModalManager.open("modalEditTransax");
});

//FORMULARIO DE TRANSACCION - MONTO INPUT
function moneyFormat(input) {
    let valor = input.value.replace(/\D/g, "");
    if (valor === "") {
        input.value = "";
        return;
    }
    
    // Si el usuario escribe "1", se convierte internamente en "0.01"
    let numero = (parseInt(valor) / 100).toFixed(2);
    
    //Separar la parte entera de los dos decimales
    let partes = numero.split(".");
    let parteEntera = partes[0];
    let parteDecimal = partes[1];
    
    // Agregar los puntos de miles a la parte entera
    parteEntera = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    //Unir la parte entera y decimal con una coma
    input.value = parteEntera + "," + parteDecimal;
}


/* RECENT TRANSACTIONS - TEMP */

let recentTransactions = [];

function saveNewTransaction() {
    const amountInput = document.getElementById("amount");
    const dateInput = document.getElementById("date");
    const categoryInput = document.getElementById("category-drop");
    const descriptionInput = document.getElementById("description-text");

    const amountRaw = amountInput.value.trim();
    const dateRaw = dateInput.value;
    const categoryRaw = categoryInput.value;
    const descriptionRaw = descriptionInput.value.trim();

    if (!amountRaw || !dateRaw || !categoryRaw || !descriptionRaw) {
        alert("Completá todos los campos antes de guardar la transacción.");
        return;
    }

    const amountNumber = parseTransactionAmount(amountRaw);

    if (!amountNumber || amountNumber <= 0) {
        alert("Ingresá un monto válido.");
        return;
    }

    const newTransaction = {
        id: Date.now().toString(),
        type: "Egreso",
        category: categoryRaw,
        description: descriptionRaw,
        amountNumber: amountNumber * -1,
        amount: `-${formatTransactionMoney(amountNumber)}`,
        date: formatTransactionDate(dateRaw)
    };

    recentTransactions.unshift(newTransaction);

    renderRecentTransactions();

    ModalManager.close("modalNewTransax");
}

function renderRecentTransactions() {
    const tableBody = document.getElementById("transactions-table-body");

    if (!tableBody) return;

    if (recentTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-transactions-row">
                <td colspan="4">
                    <div class="empty-transactions-message">
                        Aún no se han registrado transacciones
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = recentTransactions.map(transaction => {
        const amountClass = transaction.amountNumber > 0 ? "monto-positivo" : "";

        return `
            <tr class="clickable-row"
                data-id="${transaction.id}"
                data-type="${transaction.type}"
                data-category="${transaction.category}"
                data-description="${transaction.description}"
                data-amount="${transaction.amount}"
                data-date="${transaction.date}">

                <td>${transaction.date}</td>
                <td>
                    <span class="categoria-etiqueta">${transaction.category}</span>
                </td>
                <td>${transaction.description}</td>
                <td class="${amountClass}">${transaction.amount}</td>
            </tr>
        `;
    }).join("");
}

function parseTransactionAmount(value) {
    const cleanValue = value
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");

    return Number(cleanValue);
}

function formatTransactionMoney(amount) {
    return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatTransactionDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
}

async function createAccount(){
    
}