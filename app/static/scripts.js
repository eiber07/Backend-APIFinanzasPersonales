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

async function loadTransactionTypes() {
    const typeSelect = document.getElementById("transaction-type-drop");

    if (!typeSelect) return;

    typeSelect.innerHTML = `<option value="">Seleccionar</option>`;

    try {
        const response = await fetchWithAuth(
            "http://localhost:8000/parameters/parameters?parameters=transactionTypes"
        );

        if (!response.ok) {
            throw new Error("No se pudieron cargar los tipos de transacción.");
        }

        const data = await response.json();

        data.result.forEach((transactionType) => {
            const option = document.createElement("option");

            option.value = transactionType.id;
            option.textContent = formatParameterLabel(transactionType.value);

            typeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar tipos de transacción:", error);

        const errorElement = document.getElementById("error-transaction-type");

        if (errorElement) {
            errorElement.textContent = "No se pudieron cargar los tipos.";
            errorElement.classList.add("active");
        }
    }
}

function formatParameterLabel(value) {
    if (!value) return "";

    return value.charAt(0).toUpperCase() + value.slice(1);
}

async function loadUserAccounts() {
    const container = document.getElementById("btnAccounts");
    if (!container) return;
    
    container.innerHTML = "";

    try {
        const res = await fetchWithAuth("http://localhost:8000/accounts/user");
        if (!res.ok) return;

        const accounts = await res.json();
        accounts.forEach((account, index) => {
            const item = document.createElement("div");
            item.classList.add("account-item");
            item.textContent = index === 0 ? "Cuenta Personal" : account.name;
            container.appendChild(item);
        });
    } catch (err) {
        console.error("Error cargando cuentas:", err);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("clickable-img")
        ?.addEventListener("click", () => ModalManager.open("modalNewTransax"));
    document.getElementById("btn-save-new-transactions")
        ?.addEventListener("click", saveNewTransaction);

    renderRecentTransactions();
    await loadTransactionTypes();
    renderFacturasPreview();

    document.getElementById("clickable-img2")
        ?.addEventListener("click", () => ModalManager.open("modalNewExpense"));
    document.getElementById("openModal")
        ?.addEventListener("click", () => ModalManager.open("modalForget"));
    document.getElementById("btnSaveExp")
        ?.addEventListener("click", saveNewExpense);
    document.querySelector(".boton-gestionar")
        ?.addEventListener("click", () => ModalManager.open("modalExpenses"));
    document.getElementById("gastos-table-body")?.addEventListener("click", (event) => {
        const row = event.target.closest(".clickable-row");
        if (!row) return;
        openExpenseDetail(row.dataset);
    });
    
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

    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (!sidebarPlaceholder) return;

    try {
        const sidebarHTML = await fetch('/app/templates/sidebar.html').then(r => r.text());
        sidebarPlaceholder.innerHTML = sidebarHTML; 
        
        const toggle   = document.getElementById("sidebarToggle");
        const sidebar  = document.getElementById("sidebar");
        const overlay  = document.getElementById("sidebarOverlay");
        const closeBtn = document.getElementById("sidebarClose");

        function openSidebar() {
            sidebar.classList.add("open");
            overlay.classList.add("active");
            toggle?.style.setProperty("display", "none");
        }
        function closeSidebar() {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
            toggle?.style.setProperty("display", "block");
        }

        toggle?.addEventListener("click", openSidebar);
        overlay?.addEventListener("click", closeSidebar);
        closeBtn?.addEventListener("click", closeSidebar);

        document.getElementById("btnNewAccount")
            ?.addEventListener("click", () => ModalManager.open("modalNewAccount"));

    } catch (err) {
        console.error("Error cargando sidebar:", err);
    }
    const user = await loadCurrentUser();
    if (user) {
        const elName  = document.getElementById("user-name");
        const elEmail = document.getElementById("user-email");
        if (elName)  elName.textContent  = `${user.name} ${user.last_name}`;
        if (elEmail) elEmail.textContent = user.email;
        await loadUserAccounts();
        document.getElementById("btnProdfile")
            ?.addEventListener("click", () => openUserProfile(user));
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
            document.getElementById("transaction-type-drop").value = "";
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
        
        },modalGroupMembers: {
            onClose() {
                document.getElementById("member-name").value = "";
                document.getElementById("member-email").value = "";
                document.getElementById("member-role").value = "";
                const err = document.getElementById("error-member-name");
                err.textContent = "";
                err.classList.remove("active");
            }
        },modalEditMember: {
            onClose() {}

        },modalDebts: {
            onClose() {
                document.getElementById("debt-amount").value = "";
                document.getElementById("debt-date").value = "";
                document.getElementById("debtor").value = "";
                document.getElementById("creditor").value = "";
                document.getElementById("debt-description").value = "";
                const counter = document.getElementById("char-counter-debt");
                counter.textContent = "0 / 50 caracteres";
                counter.style.color = "inherit";
            }

        },modalEditDebt: {
            onClose() {}

        },modalLogout: {
            onClose() {}

        },modalExpenses: {
            onClose() {}
        },modalEditExpenses: {
            onClose() {}
        },modalUserProfile: { 
            onClose() {} 
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
const btnEditEx   = document.getElementById("btnEditEx");
const btnDeleteEx = document.getElementById("btnDeleteEx");
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

btnEditEx?.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    /*console.log("Modificar transacción ID:", id);*/
    ModalManager.open("modalModifExpens");
});

btnDeleteEx?.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!confirm(`¿Eliminar el gasto #${id}?`)) return;

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
    const transactionTypeInput = document.getElementById("transaction-type-drop");
    const descriptionInput = document.getElementById("description-text");

    const amountRaw = amountInput.value.trim();
    const dateRaw = dateInput.value;
    const categoryRaw = categoryInput.value;
    const transactionTypeId = transactionTypeInput.value;
    const transactionTypeName =
        transactionTypeInput.options[transactionTypeInput.selectedIndex]?.text.trim();

    const descriptionRaw = descriptionInput.value.trim();

    if (!amountRaw || !dateRaw || !categoryRaw || !transactionTypeId|| !descriptionRaw) {
        alert("Completa todos los campos antes de guardar la transacción.");
        return;
    }

    const amountNumber = parseTransactionAmount(amountRaw);

    if (!amountNumber || amountNumber <= 0) {
        alert("Ingresá un monto válido.");
        return;
    }

    const isIncome = transactionTypeName.toLowerCase() === "ingreso";
    
    const newTransaction = {
        id: Date.now().toString(),
        typeId: Number(transactionTypeId),
        type: transactionTypeName,
        category: categoryRaw,
        description: descriptionRaw,
        amountNumber: isIncome ? amountNumber : amountNumber * -1,
        amount: `${isIncome ? "+" : "-"}${formatTransactionMoney(amountNumber)}`,
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

async function createAccount() {
    const name = document.getElementById("account-name").value.trim();
    const description = document.getElementById("account-description").value.trim();
    const type = document.getElementById("account-category-drop").value;

    if (!name) {
        alert("Ingresá un nombre para la cuenta.");
        return;
    }

    const accountTypeId = type === "personal" ? 1 : 2

    try {
        const res = await fetchWithAuth("http://localhost:8000/accounts/", {
            method: "POST",
            body: JSON.stringify({ name, description, account_type_id: accountTypeId })
        });

        if (res.ok) {
            ModalManager.close("modalNewAccount");
            await loadUserAccounts();
        } else {
            const err = await res.json();
            alert("Error: " + err.detail);
        }
    } catch (err) {
        console.error("Error creando cuenta:", err);
    }
}

let plannedExpenses = [];

function saveNewExpense() {
    const amountInput = document.getElementById("amount-exp");
    const startDateInput = document.getElementById("start-date-exp");
    const dueDateInput = document.getElementById("due-date-exp");
    const installmentNumberInput = document.getElementById("installment-number-exp");
    const installmentAmountInput = document.getElementById("installment-amount-exp");
    const descriptionInput = document.getElementById("description-text-exp");

    const amountRaw = amountInput.value.trim();
    const startDateRaw = startDateInput.value;
    const dueDateRaw = dueDateInput.value;
    const installmentNumber = installmentNumberInput.value.trim();
    const installmentAmountRaw = installmentAmountInput.value.trim();
    const descriptionRaw = descriptionInput.value.trim();

    if (!amountRaw || !startDateRaw || !dueDateRaw || !installmentNumber || !installmentAmountRaw || !descriptionRaw) {
        alert("Completá todos los campos antes de guardar el gasto.");
        return;
    }

    const newExpense = {
        id: Date.now().toString(),
        detail: descriptionRaw,
        dueDateRaw: dueDateRaw,
        installmentPaid: 0,
        dateStart: formatTransactionDate(startDateRaw),
        dateExpiration: formatTransactionDate(dueDateRaw),
        installment: installmentNumber,
        amount: formatTransactionMoney(parseTransactionAmount(amountRaw)),
    };

    plannedExpenses.unshift(newExpense);
    renderExpenses();
    renderFacturasPreview();
    ModalManager.close("modalNewExpense");
}

function renderExpenses() {
    const tableBody = document.getElementById("gastos-table-body");
    if (!tableBody) return;

    if (plannedExpenses.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-transactions-row">
                <td colspan="6">
                    <div class="empty-transactions-message">
                        Aún no se han registrado gastos planeados
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = plannedExpenses.map(expense => `
        <tr class="clickable-row"
            data-id="${expense.id}"
            data-detail="${expense.detail}"
            data-date-start="${expense.dateStart}"
            data-date-expiration="${expense.dateExpiration}"
            data-installment="${expense.installment}"
            data-amount="${expense.amount}">

            <td>${expense.detail}</td>
            <td>${expense.dateStart}</td>
            <td>${expense.dateExpiration}</td>
            <td>${expense.installment}</td>
            <td>${expense.amount}</td>
        </tr>
    `).join("");
}

function renderFacturasPreview() {
    const list = document.getElementById("installmentCards");
    if (!list) return;

    if (plannedExpenses.length === 0) {
        list.innerHTML = `<p style="color:#6B7280; font-size:0.9rem;">Aún no hay gastos planeados</p>`;
        return;
    }

    const ordered = [...plannedExpenses]
    .sort((a, b) => new Date(a.dueDateRaw) - new Date(b.dueDateRaw))
    .slice(0, 3);

    list.innerHTML = ordered.map(expense => {
        const date = new Date(`${expense.dueDateRaw}T00:00:00`);
        const month = date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();
        const day = date.getDate();

        return `
            <article class="factura-card clickable-row"
                data-id="${expense.id}"
                data-detail="${expense.detail}"
                data-date-start="${expense.dateStart}"
                data-date-expiration="${expense.dateExpiration}"
                data-installment="${expense.installment}"
                data-installment-paid="${expense.installmentPaid}"
                data-amount="${expense.amount}">

                <div class="factura-fecha factura-fecha-gris">
                    <span>${month}</span>
                    <strong>${day}</strong>
                </div>

                <div class="factura-info">
                    <h3>${expense.detail}</h3>
                    <p>${expense.installmentPaid} de ${expense.installment} cuotas</p>
                </div>

                <div class="factura-monto">
                    <strong>${expense.amount}</strong>
                </div>
            </article>
        `;
    }).join("");
    list.querySelectorAll(".clickable-row").forEach(card => {
    card.addEventListener("click", () => openExpenseDetail(card.dataset));
});
}
function openExpenseDetail(dataset) {
    const { detail, dateStart, dateExpiration, installment, installmentPaid, amount } = dataset;
 
    document.getElementById("expense-detail").textContent = detail;
    document.getElementById("expense-startdate").textContent = dateStart;
    document.getElementById("expense-startend").textContent = dateExpiration;
    document.getElementById("expense-installments").textContent = `${installmentPaid ?? 0} de ${installment} cuotas`;
    document.getElementById("expense-amount").textContent = amount;
 
    ModalManager.open("modalEditExpenses");
}

// Cargar avatar guardado al abrir el perfil
function openUserProfile(user) {
    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-lastname").textContent = user.last_name;
    document.getElementById("profile-email").textContent = user.email;

    ModalManager.open("modalUserProfile");
}
// estado global de cuenta activa
function setActiveAccount(account) {
    activeAccount = account;
    // recargar todo
    loadTransactions(account.id);
    loadBalance(account.id);
    loadPlannedExpenses(account.id);
}

/* ====== ALERTAS ====== */
const AlertManager = (() => {
    const container = document.getElementById("alertsContainer");
    function create(type, title, message, duration = 5000) {
        if (!container) return;
        const alert = document.createElement("div");
        alert.className = `alert alert-${type}`;
        const icons = { error: "✕", success: "✓", warning: "⚠", info: "ℹ" };
        alert.innerHTML = `
            <div class="alert-icon">${icons[type]}</div>
            <div class="alert-content">
                <div class="alert-title">${title}</div>
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close">&times;</button>
        `;
        alert.querySelector(".alert-close").addEventListener("click", () => {
            alert.classList.add("removing");
            setTimeout(() => alert.remove(), 300);
        });
        container.appendChild(alert);
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.classList.add("removing");
                    setTimeout(() => alert.remove(), 300);
                }
            }, duration);
        }
        return alert;
    }
    return {
        error: (title, message, duration) => create("error", title, message, duration ?? 5000),
        success: (title, message, duration) => create("success", title, message, duration ?? 4000),
        warning: (title, message, duration) => create("warning", title, message, duration ?? 5000),
        info: (title, message, duration) => create("info", title, message, duration ?? 4000),
    };
})();

function ShowErrorMessage(message, title = "Error") {
    AlertManager.error(title, message);
}
function ShowSuccessMessage(message, title = "Éxito") {
    AlertManager.success(title, message);
}
function ShowWarningMessage(message, title = "Advertencia") {
    AlertManager.warning(title, message);
}

/* ====== INTEGRANTES DE GRUPO ====== */

let groupMembers = [];

document.getElementById("btnAddMember")?.addEventListener("click", addGroupMember);

function addGroupMember() {
    const nameInput = document.getElementById("member-name");
    const emailInput = document.getElementById("member-email");
    const roleInput = document.getElementById("member-role");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const role = roleInput.value;

    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
        document.getElementById("error-member-name").textContent = "Campo obligatorio";
        document.getElementById("error-member-name").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-member-name").classList.remove("active");
    }

    if (!email || !emailRegex.test(email)) {
        document.getElementById("error-member-email").textContent = "Email inválido";
        document.getElementById("error-member-email").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-member-email").classList.remove("active");
    }

    if (!role) {
        document.getElementById("error-member-role").textContent = "Campo obligatorio";
        document.getElementById("error-member-role").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-member-role").classList.remove("active");
    }

    if (valid) {
        const newMember = {
            id: Date.now().toString(),
            name: name,
            email: email,
            role: role
        };

        groupMembers.unshift(newMember);
        renderGroupMembers();
        updateDebtSelects();
        
        nameInput.value = "";
        emailInput.value = "";
        roleInput.value = "";

        ShowSuccessMessage("Integrante agregado correctamente", "¡Éxito!");
    }
}

function renderGroupMembers() {
    const tableBody = document.getElementById("members-table-body");

    if (!tableBody) return;

    if (groupMembers.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-transactions-row">
                <td colspan="4">
                    <div class="empty-transactions-message">
                        Aún no hay integrantes en el grupo
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = groupMembers.map(member => `
        <tr class="clickable-row"
            data-id="${member.id}"
            data-name="${member.name}"
            data-email="${member.email}"
            data-role="${member.role}">
            
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.role}</td>
            <td>
                <button class="btn-edit-member" style="background:none; border:none; color:#2563EB; cursor:pointer; font-size:12px;">Editar</button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".btn-edit-member").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const row = e.target.closest(".clickable-row");
            openMemberDetail(row.dataset);
        });
    });
}

function openMemberDetail(dataset) {
    const { id, name, email, role } = dataset;

    document.getElementById("member-detail-name").textContent = name;
    document.getElementById("member-detail-email").textContent = email;
    document.getElementById("member-detail-role").textContent = role;

    document.getElementById("btnDeleteMember").dataset.id = id;
    document.getElementById("btnEditMember").dataset.id = id;

    ModalManager.open("modalEditMember");
}

document.getElementById("btnDeleteMember")?.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    if (!confirm(`¿Eliminar al integrante?`)) return;

    groupMembers = groupMembers.filter(m => m.id !== id);
    renderGroupMembers();
    updateDebtSelects();
    ModalManager.close("modalEditMember");
    ShowSuccessMessage("Integrante eliminado", "¡Hecho!");
});

/* ====== DEUDAS ====== */

let debts = [];

const textareaDebt = document.getElementById('debt-description');
const counterDebt = document.getElementById('char-counter-debt');

if (textareaDebt && counterDebt) {
    textareaDebt.addEventListener('input', () => {
        const length = textareaDebt.value.length;
        counterDebt.textContent = `${length} / 50 caracteres`;
        counterDebt.style.color = length >= 50 ? '#dc2626' : 'inherit';
    });
}

document.getElementById("btnAddDebt")?.addEventListener("click", addDebt);

function addDebt() {
    const debtorInput = document.getElementById("debtor");
    const creditorInput = document.getElementById("creditor");
    const amountInput = document.getElementById("debt-amount");
    const dateInput = document.getElementById("debt-date");
    const descriptionInput = document.getElementById("debt-description");

    const debtor = debtorInput.value;
    const creditor = creditorInput.value;
    const amountRaw = amountInput.value.trim();
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    let valid = true;

    if (!debtor) {
        document.getElementById("error-debtor").textContent = "Campo obligatorio";
        document.getElementById("error-debtor").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-debtor").classList.remove("active");
    }

    if (!creditor) {
        document.getElementById("error-creditor").textContent = "Campo obligatorio";
        document.getElementById("error-creditor").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-creditor").classList.remove("active");
    }

    if (!amountRaw) {
        document.getElementById("error-debt-amount").textContent = "Campo obligatorio";
        document.getElementById("error-debt-amount").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-debt-amount").classList.remove("active");
    }

    if (!date) {
        document.getElementById("error-debt-date").textContent = "Campo obligatorio";
        document.getElementById("error-debt-date").classList.add("active");
        valid = false;
    } else {
        document.getElementById("error-debt-date").classList.remove("active");
    }

    if (valid) {
        const debtorName = groupMembers.find(m => m.id === debtor)?.name || debtor;
        const creditorName = groupMembers.find(m => m.id === creditor)?.name || creditor;
        const amountNumber = parseTransactionAmount(amountRaw);

        const newDebt = {
            id: Date.now().toString(),
            debtor: debtorName,
            debtorId: debtor,
            creditor: creditorName,
            creditorId: creditor,
            amount: formatTransactionMoney(amountNumber),
            amountNumber: amountNumber,
            date: formatTransactionDate(date),
            dateRaw: date,
            description: description,
            status: "Pendiente"
        };

        debts.unshift(newDebt);
        renderDebts();

        debtorInput.value = "";
        creditorInput.value = "";
        amountInput.value = "";
        dateInput.value = "";
        descriptionInput.value = "";

        ShowSuccessMessage("Deuda registrada correctamente", "¡Éxito!");
    }
}

function updateDebtSelects() {
    const debtorSelect = document.getElementById("debtor");
    const creditorSelect = document.getElementById("creditor");

    if (!debtorSelect || !creditorSelect) return;

    debtorSelect.innerHTML = '<option value="">Seleccionar</option>';
    creditorSelect.innerHTML = '<option value="">Seleccionar</option>';

    groupMembers.forEach(member => {
        const option1 = document.createElement("option");
        option1.value = member.id;
        option1.textContent = member.name;
        debtorSelect.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = member.id;
        option2.textContent = member.name;
        creditorSelect.appendChild(option2);
    });
}

function renderDebts() {
    const tableBody = document.getElementById("debts-table-body");

    if (!tableBody) return;

    if (debts.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-transactions-row">
                <td colspan="6">
                    <div class="empty-transactions-message">
                        Aún no hay deudas registradas
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = debts.map(debt => {
        const statusClass = debt.status === "Pagada" ? "monto-positivo" : "";
        return `
            <tr class="clickable-row"
                data-id="${debt.id}"
                data-debtor="${debt.debtor}"
                data-creditor="${debt.creditor}"
                data-amount="${debt.amount}"
                data-date="${debt.date}"
                data-description="${debt.description}"
                data-status="${debt.status}">
                
                <td>${debt.debtor}</td>
                <td>${debt.creditor}</td>
                <td>${debt.amount}</td>
                <td>${debt.date}</td>
                <td class="${statusClass}"><strong>${debt.status}</strong></td>
                <td>
                    <button class="btn-edit-debt" style="background:none; border:none; color:#2563EB; cursor:pointer; font-size:12px;">Ver</button>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll(".btn-edit-debt").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const row = e.target.closest(".clickable-row");
            openDebtDetail(row.dataset);
        });
    });
}

function openDebtDetail(dataset) {
    const { id, debtor, creditor, amount, date, description, status } = dataset;

    document.getElementById("debt-detail-debtor").textContent = debtor;
    document.getElementById("debt-detail-creditor").textContent = creditor;
    document.getElementById("debt-detail-amount").textContent = amount;
    document.getElementById("debt-detail-date").textContent = date;
    document.getElementById("debt-detail-description").textContent = description;
    document.getElementById("debt-detail-status").textContent = status;

    document.getElementById("btnDeleteDebt").dataset.id = id;
    document.getElementById("btnEditDebt").dataset.id = id;
    document.getElementById("btnMarkPaid").dataset.id = id;

    ModalManager.open("modalEditDebt");
}

document.getElementById("btnDeleteDebt")?.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    if (!confirm(`¿Eliminar esta deuda?`)) return;

    debts = debts.filter(d => d.id !== id);
    renderDebts();
    ModalManager.close("modalEditDebt");
    ShowSuccessMessage("Deuda eliminada", "¡Hecho!");
});

document.getElementById("btnMarkPaid")?.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    const debt = debts.find(d => d.id === id);

    if (debt) {
        debt.status = debt.status === "Pagada" ? "Pendiente" : "Pagada";
        renderDebts();
        openDebtDetail(debt);
        ShowSuccessMessage(`Deuda marcada como ${debt.status}`, "¡Actualizado!");
    }
});

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("btnLogoutTop")?.addEventListener("click", () => {
        ModalManager.open("modalLogout");
    });

    document.getElementById("btnConfirmLogout")?.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
    });

});