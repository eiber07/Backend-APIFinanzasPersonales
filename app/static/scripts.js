/* DATOS DE BACKEND */
let activeAccount = null;
let currentUser = null;
let currentEditTransactionId = null;
let filteredTransactions = [];

let selectedFilterMonth = new Date().getMonth() + 1;
let selectedFilterYear = new Date().getFullYear();

const MONTH_NAMES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];
let currentTransactionId = null;
let currentExpenseId = null;
let currentTransactionPlannedExpenseId = null;



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

// estado global de cuenta activa
async function setActiveAccount(account, displayName = account.name) {
    activeAccount = account;

    const headerName = document.getElementById("header-account-name");

    if (headerName) {
        headerName.textContent = displayName;
    }

    await updateMembersSection();

    await loadTransactions(account.id);
    await loadPlannedExpenses(account.id);
    // Mostrar deudas solo en cuentas grupales
    const seccionDeudas = document.getElementById("debts-component");
    if (seccionDeudas) {
        if (account.account_type === "grupal") {
            seccionDeudas.style.display = "block";
            await loadGroupDebts(account.id);
        } else {
            seccionDeudas.style.display = "none";
        }
    }
}

function isGroupAccount(account) {
    return String(account?.account_type || "")
        .trim()
        .toLowerCase() === "grupal";
}

async function updateMembersSection() {
    const membersSection = document.getElementById("members-section");
    const rigthColumn = document.querySelector(".columna-derecha");

    if (!membersSection) return;

    const isGroup = isGroupAccount(activeAccount);

    membersSection.hidden = !isGroup;

    rigthColumn?.classList.toggle("cuenta-grupal",isGroup);

    if (!isGroup) {
        ModalManager.close("modalMembers");
        return;
    }

    await loadMembers(activeAccount.id);
}

async function loadMembers(accountId) {
    const membersList = document.getElementById("members-list");

    if (!membersList) return;

    try {
        const response = await fetchWithAuth(
            `http://localhost:8000/accounts/${accountId}/members`
        );

        if (!response.ok) {
            throw new Error("No se pudieron cargar los miembros.");
        }

        const members = await response.json();

        const balancesByUserId = await loadGroupSettlement(accountId);

        renderMembers(members, balancesByUserId);

    } catch (error) {
        console.error("Error cargando miembros:", error);

        membersList.innerHTML = `
            <p class="members-empty">
                No se pudieron cargar los miembros.
            </p>
        `;
    }
}

async function loadGroupSettlement(accountId) {
    try {
        const response = await fetchWithAuth(
            `http://localhost:8000/transactions/group-settlement/${accountId}?month=${selectedFilterMonth}&year=${selectedFilterYear}`
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            console.warn(
                "No se pudo calcular el balance grupal:",
                errorData.detail || "Error desconocido"
            );

            return null;
        }

        const settlement = await response.json();

        const balancesByUserId = new Map();

        (settlement.balances || []).forEach((item) => {
            balancesByUserId.set(
                Number(item.user_id),
                Number(item.balance)
            );
        });

        return balancesByUserId;

    } catch (error) {
        console.error("Error cargando liquidación grupal:", error);

        return null;
    }
}

function formatMemberBalance(balance) {
    const numericBalance = Number(balance) || 0;
    const absoluteBalance = Math.abs(numericBalance);

    const formattedBalance = absoluteBalance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (numericBalance > 0) {
        return `+$${formattedBalance}`;
    }

    if (numericBalance < 0) {
        return `-$${formattedBalance}`;
    }

    return `$${formattedBalance}`;
}

function getMemberBalanceLabel(balance) {
    const numericBalance = Number(balance) || 0;

    if (numericBalance > 0) {
        return "Saldo a favor";
    }

    if (numericBalance < 0) {
        return "Debe";
    }

    return "Al día";
}

function renderMembers(members, balancesByUserId = null) {
    const membersList = document.getElementById("members-list");
    const addButton = document.getElementById("btnOpenMembers");

    if (!membersList) return;

    membersList.innerHTML = "";

    if (!members || members.length === 0) {
        membersList.innerHTML = `
            <p class="members-empty">
                Aún no hay miembros cargados.
            </p>
        `;

        if (addButton) {
            addButton.hidden = true;
        }

        return;
    }

    const currentMember = members.find(
        (member) => Number(member.user_id) === Number(currentUser?.id)
    );

    if (addButton) {
        addButton.hidden = currentMember?.role !== "admin";
    }

    members.forEach((member) => {
        const item = document.createElement("article");
        item.classList.add("member-item");

        const information = document.createElement("div");

        const name = document.createElement("p");
        name.classList.add("member-name");
        name.textContent = `${member.name} ${member.last_name}`.trim();

        const status = document.createElement("p");
        status.classList.add("member-status");

        if (Number(member.user_id) === Number(currentUser?.id)) {
            status.textContent = "Vos";
        } else if (member.role === "admin") {
            status.textContent = "Administrador";
        } else {
            status.textContent = "Activo";
        }

        information.appendChild(name);
        information.appendChild(status);

        const balanceInfo = document.createElement("div");
        balanceInfo.classList.add("member-balance-info");

        const balance = balancesByUserId?.get(
            Number(member.user_id)
        );

        const balanceAmount = document.createElement("p");
        balanceAmount.classList.add("member-balance");

        const balanceLabel = document.createElement("p");
        balanceLabel.classList.add("member-balance-label");

        if (balance === undefined || balance === null) {
            balanceAmount.textContent = "—";
            balanceAmount.classList.add("member-balance-neutral");

            balanceLabel.textContent = "Sin calcular";
        } else {
            balanceAmount.textContent = formatMemberBalance(balance);

            if (balance > 0) {
                balanceAmount.classList.add("member-balance-positive");
            } else if (balance < 0) {
                balanceAmount.classList.add("member-balance-negative");
            } else {
                balanceAmount.classList.add("member-balance-neutral");
            }

            balanceLabel.textContent = getMemberBalanceLabel(balance);
        }

        balanceInfo.appendChild(balanceAmount);
        balanceInfo.appendChild(balanceLabel);

        item.appendChild(information);
        item.appendChild(balanceInfo);

        membersList.appendChild(item);
    });
}

function showMemberEmailError(message) {
    const errorElement = document.getElementById("error-member-email");

    if (!errorElement) return;

    errorElement.textContent = message;
    errorElement.classList.add("active");
}

function clearMemberEmailError() {
    const errorElement = document.getElementById("error-member-email");

    if (!errorElement) return;

    errorElement.textContent = "";
    errorElement.classList.remove("active");
}

async function saveMember() {
    const emailInput = document.getElementById("member-email");
    const saveButton = document.getElementById("btnSaveMember");

    if (!activeAccount || !isGroupAccount(activeAccount)) {
        ShowErrorMessage("Seleccioná una cuenta grupal.");
        return;
    }

    const email = emailInput?.value.trim().toLowerCase();

    if (!email) {
        showMemberEmailError("Ingresá un correo electrónico.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        showMemberEmailError("Ingresá un correo electrónico válido.");
        return;
    }

    clearMemberEmailError();

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Agregando...";
    }

    try {
        const response = await fetchWithAuth(
            `http://localhost:8000/accounts/${activeAccount.id}/members`,
            {
                method: "POST",
                body: JSON.stringify({ email }),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            showMemberEmailError(
                data.detail || "No se pudo agregar el miembro."
            );
            return;
        }

        emailInput.value = "";

        ModalManager.close("modalMembers");

        await loadMembers(activeAccount.id);

        ShowSuccessMessage("Miembro agregado correctamente.");
    } catch (error) {
        console.error("Error agregando miembro:", error);
        showMemberEmailError("No se pudo conectar con el servidor.");
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Agregar miembro";
        }
    }
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

function getAccountDisplayName(account) {
    const accountType = String(account.account_type || "")
        .trim()
        .toLowerCase();

    return account.name;
}

async function loadUserAccounts() {
    const container = document.getElementById("btnAccounts");

    if (!container) return;

    container.innerHTML = "";

    try {
        const response = await fetchWithAuth("http://localhost:8000/accounts/user");

        if (!response.ok) {
            throw new Error("No se pudieron cargar las cuentas.");
        }

        const accounts = await response.json();

        const orderedAccounts = [...accounts].sort((accountA, accountB) => {
            const accountAIsPersonal =
                String(accountA.account_type || "").toLowerCase() === "personal";

            const accountBIsPersonal =
                String(accountB.account_type || "").toLowerCase() === "personal";

            return Number(accountBIsPersonal) - Number(accountAIsPersonal);
        });

        orderedAccounts.forEach((account) => {
            const item = document.createElement("div");
            const displayName = getAccountDisplayName(account);

            item.classList.add("account-item");
            item.textContent = displayName;
            item.dataset.displayName = displayName;

            item.addEventListener("click", async () => {
                document
                    .querySelectorAll(".account-item")
                    .forEach((accountItem) =>
                        accountItem.classList.remove("active")
                    );

                item.classList.add("active");

                await setActiveAccount(account, displayName);
            });

            container.appendChild(item);
        });

        if (orderedAccounts.length > 0) {
            const firstAccount = orderedAccounts[0];
            const firstItem = container.querySelector(".account-item");

            firstItem?.classList.add("active");

            await setActiveAccount(
                firstAccount,
                getAccountDisplayName(firstAccount)
            );
        }
    } catch (error) {
        console.error("Error cargando cuentas:", error);
    }
}

function initializePeriodFilter() {
    const monthSelect = document.getElementById("filter-month");
    const yearSelect = document.getElementById("filter-year");

    if (!monthSelect || !yearSelect) return;

    monthSelect.innerHTML = MONTH_NAMES.map((month, index) => `
        <option value="${index + 1}">
            ${month}
        </option>
    `).join("");

    monthSelect.value = String(selectedFilterMonth);

    updateYearFilterOptions();

    monthSelect.addEventListener("change", handlePeriodFilterChange);
    yearSelect.addEventListener("change", handlePeriodFilterChange);
}

async function handlePeriodFilterChange() {
    const monthSelect = document.getElementById("filter-month");
    const yearSelect = document.getElementById("filter-year");

    selectedFilterMonth = Number(monthSelect.value);
    selectedFilterYear = Number(yearSelect.value);

    applyPeriodFilter();

    if (activeAccount && isGroupAccount(activeAccount)) {
        await loadMembers(activeAccount.id);
        await loadGroupDebts(activeAccount.id);
    }
}

function updateYearFilterOptions() {
    const yearSelect = document.getElementById("filter-year");

    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();

    /*
        Rango inicial visible:
        2021 a 2031 si el año actual es 2026.
    */
    const years = new Set();

    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        years.add(year);
    }

    /*
        También agrega años existentes en transacciones,
        aunque estén fuera del rango anterior.
    */
    recentTransactions.forEach((transaction) => {
        const year = Number(String(transaction.dateRaw).slice(0, 4));

        if (year) {
            years.add(year);
        }
    });

    /*
        También agrega años existentes en cuotas/facturas.
    */
    plannedExpenses.forEach((expense) => {
        expense.allInstallments.forEach((installment) => {
            const year = Number(
                String(installment.dueDateRaw).slice(0, 4)
            );

            if (year) {
                years.add(year);
            }
        });
    });

    const orderedYears = [...years].sort((yearA, yearB) => {
        return yearB - yearA;
    });

    yearSelect.innerHTML = orderedYears.map((year) => `
        <option value="${year}">
            ${year}
        </option>
    `).join("");

    yearSelect.value = String(selectedFilterYear);
}

function dateMatchesSelectedPeriod(dateValue) {
    if (!dateValue) return false;

    const [year, month] = String(dateValue)
        .split("-")
        .map(Number);

    return (
        year === selectedFilterYear &&
        month === selectedFilterMonth
    );
}

function getSelectedPeriodLabel() {
    return `${MONTH_NAMES[selectedFilterMonth - 1]} ${selectedFilterYear}`;
}

function applyPeriodFilter() {
    filteredTransactions = recentTransactions.filter((transaction) =>
        dateMatchesSelectedPeriod(transaction.dateRaw)
    );

    renderRecentTransactions();
    updateAccountTotals();
    renderFacturasPreview();
}

async function loadTransactions(accountId) {
    const tableBody = document.getElementById("transactions-table-body");
    if (!tableBody) return;

    try {
        const res = await fetchWithAuth(`http://localhost:8000/transactions/account/${accountId}`);
        if (!res.ok) return;

        const transactions = await res.json();

        recentTransactions = transactions.map(t => ({
            id: t.id.toString(),
            type: t.type,
            typeId: t.type_id,
            category: t.category,
            categoryId: t.category_id,
            description: t.description,
            memberId: t.user_id ?? null,
            memberName: t.user_name || "Sin asignar",
            dateRaw: t.transaction_date.split("T")[0],
            amountNumber: t.type === "ingreso" ? parseFloat(t.amount) : parseFloat(t.amount) * -1,
            amount: `${t.type === "ingreso" ? "+" : "-"}${formatTransactionMoney(parseFloat(t.amount))}`,
            plannedExpenseId: t.planned_expense_id ? t.planned_expense_id.toString() : null,
            date: formatTransactionDate(t.transaction_date.split("T")[0])
        }));

    updateYearFilterOptions();
    applyPeriodFilter();

    } catch (err) {
        console.error("Error cargando transacciones:", err);
    }
}

async function loadPlannedExpenses(accountId) {
    try {
        const res = await fetchWithAuth(`http://localhost:8000/planned_expenses/account/${accountId}`);
        if (!res.ok) return;

        const expenses = await res.json();
        const grouped = {};
        expenses.forEach(e => {
            const groupId = e.id_planned_expense;
            if (!grouped[groupId]) {
                grouped[groupId] = {
                    id: groupId.toString(),
                    detail: e.description,
                    installmentAmount: formatTransactionMoney(parseFloat(e.installment_amount)),
                    installmentAmountRaw: parseFloat(e.installment_amount),
                    installments: [],
                };
            }
            grouped[groupId].installments.push({
                installmentNumber: e.installment_number,
                dueDateRaw: e.due_date.split("T")[0],
                dueDate: formatTransactionDate(e.due_date.split("T")[0]),
                statusId: e.status_id,
            });
        });

        plannedExpenses = Object.values(grouped).map(group => {
            const total = group.installments.length;
            const paid = group.installments.filter(i => i.statusId === 2).length;
            const nextPending = group.installments
                .filter(i => i.statusId === 1)
                .sort((a, b) => new Date(a.dueDateRaw) - new Date(b.dueDateRaw))[0];

            return {
                id: group.id,
                detail: group.detail,
                installmentAmount: group.installmentAmount,
                installmentAmountRaw: group.installmentAmountRaw,
                totalInstallments: total,
                paidInstallments: paid,
                total: formatTransactionMoney(group.installmentAmountRaw * total),
                nextInstallment: nextPending ? nextPending.installmentNumber : null,
                nextDueDateRaw: nextPending ? nextPending.dueDateRaw : null,
                nextDueDate: nextPending ? nextPending.dueDate : null,
                allInstallments: group.installments,
                completed: paid === total,
            };
        });

        renderExpenses();
        updateYearFilterOptions();
        applyPeriodFilter();

    } catch (err) {
        console.error("Error cargando gastos planificados:", err);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("info-modal")?.addEventListener("click", () => {
    if (!activeAccount) return;

        document.getElementById("account-info-id").textContent   = activeAccount.id;
        document.getElementById("account-info-name").textContent = activeAccount.name;
        document.getElementById("account-info-type").textContent =
            activeAccount.account_type === "personal" ? "Personal" : "Grupal";

        ModalManager.open("modalAccountInfo");
    });
    document.getElementById("btnDeleteAccount")?.addEventListener("click", deleteActiveAccount);


    document.getElementById("btnLogoutTop")?.addEventListener("click", () => {
        ModalManager.open("modalLogout");
    });

    document.getElementById("btnOpenMembers")
    ?.addEventListener("click", () => {
        if (!isGroupAccount(activeAccount)) return;

        ModalManager.open("modalMembers");
    });

    document.getElementById("btnSaveMember")
    ?.addEventListener("click", saveMember);

    document.getElementById("btnConfirmLogout")?.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
    });

    document.getElementById("clickable-img")
        ?.addEventListener("click", () => ModalManager.open("modalNewTransax"));
        
    initializePeriodFilter();

    await loadTransactionCategories();
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
        if (row.dataset.completed === "true") return;
        openExpenseDetail(row.dataset);
    });

    document.getElementById("transaction-type-drop")?.addEventListener("change", (e) => {
        const amountInput = document.getElementById("amount");
        amountInput.removeAttribute("readonly");
        amountInput.style.background = "";
        amountInput.value = "";
        const selectedText = e.target.options[e.target.selectedIndex]?.text.trim().toLowerCase();
        const plannedGroup = document.getElementById("planned-expense-group");
        const plannedDrop = document.getElementById("planned-expense-drop");

        if (selectedText === "gasto planificado") {
            plannedGroup.style.display = "block";
            plannedDrop.innerHTML = `<option value="">Ninguno</option>`;
            plannedExpenses
                .filter(exp => !exp.completed)
                .forEach(exp => {
                    const option = document.createElement("option");
                    option.value = exp.id;
                    option.dataset.installmentNumber = exp.nextInstallment;
                    option.textContent = `${exp.detail} — Cuota ${exp.nextInstallment} de ${exp.totalInstallments}`;
                    plannedDrop.appendChild(option);
                });
        } else {
            plannedGroup.style.display = "none";
        }
    });

    document.getElementById("planned-expense-drop")?.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;

        const exp = plannedExpenses.find(exp => exp.id === selectedId);
        if (!exp) return;

        const amountInput = document.getElementById("amount");
        // Convertir installmentAmount al formato del input
        const raw = parseFloat(exp.installmentAmount.replace(/[^0-9.]/g, ""));
        let parteEntera = Math.floor(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        amountInput.value = `${parteEntera},${(raw % 1).toFixed(2).slice(2)}`;
        amountInput.setAttribute("readonly", true);
        amountInput.style.background = "#D1D5DB";
    });
    
    const textarea  = document.getElementById('description-text');
    const counter   = document.getElementById('char-counter');
    const textarea2 = document.getElementById('description-text-exp');
    const counter2  = document.getElementById('char-counter-exp');

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
        
        const textarea3 = document.getElementById('account-description');
        const counter3  = document.getElementById('char-counter3');
            if (textarea3 && counter3) {
        textarea3.addEventListener('input', () => {
            const l = textarea3.value.length;
            counter3.textContent = `${l} / 25 caracteres`;
            counter3.style.color = l >= 25 ? '#dc2626' : 'inherit';
        });
    }

    } catch (err) {
        console.error("Error cargando sidebar:", err);
    }
    const user = await loadCurrentUser();
    if (user) {
        currentUser = user;
        const elName  = document.getElementById("user-name");
        const elEmail = document.getElementById("user-email");
        if (elName)  elName.textContent  = `${user.name} ${user.last_name}`;
        if (elEmail) elEmail.textContent = user.email;
        await loadUserAccounts();
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
async function deleteActiveAccount() {
    if (!activeAccount) return;

    const accountName = activeAccount.name;

    if (!confirm(`¿Eliminar la cuenta "${accountName}"? Esta acción no se puede deshacer.`)) return;

    try {
        const res = await fetchWithAuth(
            `http://localhost:8000/accounts/deactivate/${activeAccount.id}`,
            { method: "PUT" }
        );

        if (res.ok) {
            ShowSuccessMessage("Cuenta eliminada correctamente.");
            ModalManager.close("modalAccountInfo");
            activeAccount = null;
            await loadUserAccounts();
        } else {
            const err = await res.json();
            ShowErrorMessage(err.detail || "No se pudo eliminar la cuenta.");
        }
    } catch {
        ShowErrorMessage("No se pudo conectar con el servidor.");
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
            document.getElementById("amount").removeAttribute("readonly");
            document.getElementById("amount").style.background = "";
            document.getElementById("date").value = "";
            document.getElementById("category-drop").value = "";
            document.getElementById("transaction-type-drop").value = "";
            document.getElementById("description-text").value = "";
            document.getElementById("planned-expense-drop").value = "";
            document.getElementById("planned-expense-group").style.display = "none";
            const counter = document.getElementById("char-counter");
                    counter.textContent = "0 / 25 caracteres";
                    counter.style.color = "inherit"

        }},modalEditTransax: {
            onClose() {
                currentEditTransactionId = null;
                document.getElementById("edit-amount").value = "";
                document.getElementById("edit-amount").removeAttribute("readonly");
                document.getElementById("edit-amount").style.background = "";
                document.getElementById("edit-date").value = "";
                document.getElementById("edit-category-drop").value = "";
                document.getElementById("edit-transaction-type-drop").value = "";
                document.getElementById("edit-description-text").value = "";
            }
        },modalNewExpense:{
            onClose() {
                document.getElementById("installment-number-exp").value = "";
                document.getElementById("amount-exp").value = "";
                document.getElementById("installment-amount-exp").value = "";
                document.getElementById("payment-date-exp").value = "";
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
        }, modalMembers: {
            onClose() {
                const emailInput = document.getElementById("member-email");

                if (emailInput) {
                    emailInput.value = "";
                }

                clearMemberEmailError();
            }
        },modalAccountInfo: {
            onClose() {
                document.getElementById("account-info-id").textContent   = "";
                document.getElementById("account-info-name").textContent = "";
                document.getElementById("account-info-type").textContent = "";
            }
        },modalLogout: {
            onClose() {}
        },modalExpenses: {
            onClose() {}
        },modalEditExpenses: {
            onClose() {
                currentExpenseId = null;
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
        const {id, type, category, description, amount, date, plannedExpenseId} = row.dataset;
        currentTransactionId = id;
        currentTransactionPlannedExpenseId = plannedExpenseId || null;
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

btnEdit?.addEventListener("click", async (e) => {
    const id = currentTransactionId;
    currentEditTransactionId = id;

    // Buscar la transacción en el array local
    const t = recentTransactions.find(t => t.id === id);
    if (!t) return;

    // Prellenar campos
    document.getElementById("edit-amount").value = formatTransactionMoney(Math.abs(t.amountNumber)).replace("$", "");
    document.getElementById("edit-date").value = t.dateRaw || "";
    document.getElementById("edit-description-text").value = t.description;

    const editAmount = document.getElementById("edit-amount");
    if (currentTransactionPlannedExpenseId) {
        editAmount.setAttribute("readonly", true);
        editAmount.style.background = "#D1D5DB";
    } else {
        editAmount.removeAttribute("readonly");
        editAmount.style.background = "";
    }
    await loadEditTransactionCategories();
    await loadEditTransactionTypes();

    ModalManager.open("modalEditTransax");
});


document.getElementById("btnSaveEditTransax")?.addEventListener("click", async () => {
    const amountRaw = document.getElementById("edit-amount").value.trim();
    const dateRaw = document.getElementById("edit-date").value;
    const categoryId = document.getElementById("edit-category-drop").value;
    const typeId = document.getElementById("edit-transaction-type-drop").value;
    const description = document.getElementById("edit-description-text").value.trim();

    if (!amountRaw || !dateRaw || !categoryId || !typeId || !description) {
        ShowErrorMessage("Completá todos los campos.");
        return;
    }

    const amountNumber = parseTransactionAmount(amountRaw);

    try {
        const res = await fetchWithAuth("http://localhost:8000/transactions/", {
            method: "PUT",
            body: JSON.stringify({
                id: Number(currentEditTransactionId),
                type_id: Number(typeId),
                amount: amountNumber,
                description: description,
                category_id: Number(categoryId),
                transaction_date: `${dateRaw}T00:00:00`
            })
        });

        if (res.ok) {
            ShowSuccessMessage("Transacción actualizada correctamente.");
            await loadTransactions(activeAccount.id);
            if (isGroupAccount(activeAccount)) {
                await loadMembers(activeAccount.id);
                await loadGroupDebts(activeAccount.id);
            }
            ModalManager.close("modalEditTransax");
            ModalManager.close("modalTransax");
        } else {
            const err = await res.json();
            ShowErrorMessage(err.detail || "Error al actualizar la transacción.");
        }
    } catch (err) {
        console.error("Error:", err);
        ShowErrorMessage("No se pudo conectar con el servidor.");
    }
});

btnDelete?.addEventListener("click", async (e) => {
    const id = currentTransactionId;

    if (currentTransactionPlannedExpenseId) {
        ShowErrorMessage("No podés eliminar una transacción asociada a un gasto planificado.");
        return;
    }

    if (!confirm(`¿Eliminar la transacción #${id}?`)) return;

    try {
        const res = await fetchWithAuth(`http://localhost:8000/transactions/deactivate/${id}`, {
            method: "PUT"
        });

        if (res.ok) {
            ShowSuccessMessage("Transacción eliminada correctamente.");
            await loadTransactions(activeAccount.id);
            if (isGroupAccount(activeAccount)) {
                await loadMembers(activeAccount.id);
                await loadGroupDebts(activeAccount.id);
            }
            ModalManager.close(MODAL_TX);
        } else {
            const err = await res.json();
            ShowErrorMessage(err.detail || "Error al eliminar la transacción.");
        }
    } catch {
        ShowErrorMessage("No se pudo establecer conexión con el servidor.");
    }
});

btnDeleteEx?.addEventListener("click", async (e) => {
    const id = currentExpenseId;
    if (!confirm(`¿Eliminar el gasto #${id}?`)) return;

    try {
        const res = await fetchWithAuth(`http://localhost:8000/planned_expenses/deactivate/${id}`, {
            method: "PUT"
        });

        if (res.ok) {
            ShowSuccessMessage("Gasto eliminado correctamente.");
            await loadPlannedExpenses(activeAccount.id);
            ModalManager.close("modalEditExpenses");
            ModalManager.close("modalExpenses");
        } else {
            const err = await res.json();
            ShowErrorMessage(err.detail || "Error al eliminar el gasto.");
        }
    } catch {
        ShowErrorMessage("No se pudo establecer conexión con el servidor.");
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

async function saveNewTransaction() {
    const amountRaw = document.getElementById("amount").value.trim();
    const dateRaw = document.getElementById("date").value;
    const categoryId = document.getElementById("category-drop").value;
    const transactionTypeInput = document.getElementById("transaction-type-drop");
    const transactionTypeId = transactionTypeInput.value;
    const transactionTypeName = transactionTypeInput.options[transactionTypeInput.selectedIndex]?.text.trim();
    const descriptionRaw = document.getElementById("description-text").value.trim();
    const plannedExpenseId = document.getElementById("planned-expense-drop")?.value || null;
    const plannedExpenseDrop = document.getElementById("planned-expense-drop");
    const selectedOption = plannedExpenseDrop?.options[plannedExpenseDrop.selectedIndex];
    const plannedExpenseInstallmentNumber = selectedOption?.dataset.installmentNumber || null;


    if (!amountRaw || !dateRaw || !categoryId || !transactionTypeId || !descriptionRaw) {
        ShowErrorMessage("Completá todos los campos antes de guardar la transacción.");
        return;
    }

    const amountNumber = parseTransactionAmount(amountRaw);
    if (!amountNumber || amountNumber <= 0) {
        ShowErrorMessage("Ingresá un monto válido.");
        return;
    }

    try {
        const res = await fetchWithAuth("http://localhost:8000/transactions/", {
            method: "POST",
            body: JSON.stringify({
            account_id: activeAccount.id,
            type_id: Number(transactionTypeId),
            amount: amountNumber,
            description: descriptionRaw,
            category_id: Number(categoryId),
            planned_expense_id: plannedExpenseId ? Number(plannedExpenseId) : null,
            planned_expense_installment_number: plannedExpenseInstallmentNumber ? Number(plannedExpenseInstallmentNumber) : null,
            transaction_date: `${dateRaw}T00:00:00`
        })
        });

        if (res.ok) {
            ShowSuccessMessage("Transacción guardada correctamente.");
            await loadTransactions(activeAccount.id);
            await loadPlannedExpenses(activeAccount.id);
            if (isGroupAccount(activeAccount)) {
                await loadMembers(activeAccount.id);
                await loadGroupDebts(activeAccount.id);
            }
            ModalManager.close("modalNewTransax");
        } else {
            const err = await res.json();
            ShowErrorMessage(err.detail || "Error al guardar la transacción.");
        }
    } catch (err) {
        console.error("Error:", err);
        ShowErrorMessage("No se pudo conectar con el servidor.");
    }
}

async function loadTransactionCategories() {
    const categorySelect = document.getElementById("category-drop");
    if (!categorySelect) return;

    categorySelect.innerHTML = `<option value="">Seleccionar</option>`;

    try {
        const res = await fetchWithAuth(
            "http://localhost:8000/parameters/parameters?parameters=transactionCategories"
        );
        if (!res.ok) return;

        const data = await res.json();
        data.result.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = formatParameterLabel(cat.value);
            categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error cargando categorías:", err);
    }
}

function updateAccountTotals() {
    const balanceElement = document.getElementById("balance-total");
    const incomeElement = document.getElementById("income-total");
    const expenseElement = document.getElementById("expense-total");

    let incomeTotal = 0;
    let expenseTotal = 0;

    filteredTransactions.forEach((transaction) => {
        const amount = Number(transaction.amountNumber) || 0;

        if (amount > 0) {
            incomeTotal += amount;
        } else {
            expenseTotal += Math.abs(amount);
        }
    });

    const balanceTotal = incomeTotal - expenseTotal;

    if (balanceElement) {
        balanceElement.textContent = formatDashboardMoney(balanceTotal);
    }

    if (incomeElement) {
        incomeElement.textContent = formatDashboardMoney(incomeTotal);
    }

    if (expenseElement) {
        expenseElement.textContent = formatDashboardMoney(expenseTotal);
    }
}

function renderRecentTransactions() {
    const tableBody = document.getElementById("transactions-table-body");
    const memberHeader = document.getElementById(
        "transaction-member-header"
    );

    if (!tableBody) return;

    const showMemberColumn = isGroupAccount(activeAccount);

    if (memberHeader) {
        memberHeader.hidden = !showMemberColumn;
    }

    const transactionsTable = tableBody.closest(".tabla-transacciones");

    if (transactionsTable) {
        transactionsTable.classList.toggle(
            "tabla-personal",
            !showMemberColumn
        );

        transactionsTable.classList.toggle(
            "tabla-grupal",
            showMemberColumn
        );
    }

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-transactions-row">
                <td colspan="${showMemberColumn ? 5 : 4}">
                    <div class="empty-transactions-message">
                        No se registraron transacciones en ${getSelectedPeriodLabel()}
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = filteredTransactions.map((transaction) => {
        const amountClass = transaction.amountNumber > 0
            ? "monto-positivo"
            : "";

        const memberCell = showMemberColumn
            ? `
                <td class="columna-miembro">
                    ${transaction.memberName}
                </td>
            `
            : "";

        return `
            <tr class="clickable-row"
                data-id="${transaction.id}"
                data-type="${transaction.type}"
                data-category="${transaction.category}"
                data-description="${transaction.description}"
                data-amount="${transaction.amount}"
                data-date="${transaction.date}"
                data-planned-expense-id="${transaction.plannedExpenseId ?? ''}">

                <td>${transaction.date}</td>

                <td>
                    <span class="categoria-etiqueta">
                        ${transaction.category}
                    </span>
                </td>

                <td>${transaction.description}</td>

                ${memberCell}

                <td class="${amountClass}">
                    ${transaction.amount}
                </td>
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

function formatDashboardMoney(amount) {
    const numericAmount = Number(amount) || 0;
    const absoluteAmount = Math.abs(numericAmount);

    const formattedAmount = absoluteAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return numericAmount < 0
        ? `-$${formattedAmount}`
        : `$${formattedAmount}`;
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

async function saveNewExpense() {
    const installmentNumber = document.getElementById("installment-number-exp").value.trim();
    const installmentAmountRaw = document.getElementById("installment-amount-exp").value.trim();
    const paymentDateRaw = document.getElementById("payment-date-exp").value;
    const descriptionRaw = document.getElementById("description-text-exp").value.trim();

    if (!installmentNumber || !paymentDateRaw || !descriptionRaw || !installmentAmountRaw) {
        ShowErrorMessage("Completá todos los campos antes de guardar el gasto.");
        return;
    }

    const installmentAmountNumber = parseTransactionAmount(installmentAmountRaw); 
    
    if (!installmentAmountNumber || installmentAmountNumber <= 0) {
        ShowErrorMessage("El monto por cuota debe ser mayor a 0.");
        return;
    }

    try {
        const res = await fetchWithAuth("http://localhost:8000/planned_expenses/", {
            method: "POST",
            body: JSON.stringify({
                account_id: activeAccount.id,
                description: descriptionRaw,
                installment_amount: installmentAmountNumber,
                installments: Number(installmentNumber),
                due_date: `${paymentDateRaw}T00:00:00`
            })
        });

        if (res.ok) {
            ShowSuccessMessage("Gasto planificado guardado correctamente.");
            await loadPlannedExpenses(activeAccount.id);
            ModalManager.close("modalNewExpense");
        } else {
            const err = await res.json();
            ShowErrorMessage(err.detail || "Error al guardar el gasto.");
        }
    } catch (err) {
        console.error("Error:", err);
        ShowErrorMessage("No se pudo conectar con el servidor.");
    }
}

function renderExpenses() {
    const tableBody = document.getElementById("gastos-table-body");
    if (!tableBody) return;

    if (plannedExpenses.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-transactions-row">
                <td colspan="5">
                    <div class="empty-transactions-message">
                        Aún no se han registrado gastos planeados
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = plannedExpenses.map(expense => `
        <tr class="clickable-row ${expense.completed ? 'factura-completada' : ''}"
            data-id="${expense.id}"
            data-detail="${expense.detail}"
            data-total-installments="${expense.totalInstallments}"
            data-paid-installments="${expense.paidInstallments}"
            data-next-installment="${expense.nextInstallment ?? ''}"
            data-next-due-date="${expense.nextDueDate ?? ''}"
            data-installment-amount="${expense.installmentAmount}"
            data-total="${expense.total}"
            data-completed="${expense.completed}">

            <td>${expense.detail}</td>
            <td>${expense.paidInstallments} de ${expense.totalInstallments} cuotas</td>
            <td>${expense.nextDueDate ?? 'Completado'}</td>
            <td>${expense.installmentAmount}</td>
            <td>${expense.total}</td>
        </tr>
    `).join("");
}

function renderFacturasPreview() {
    const list = document.getElementById("installmentCards");

    if (!list) return;

    const periodInstallments = plannedExpenses
        .flatMap((expense) =>
            expense.allInstallments
                .filter((installment) =>
                    dateMatchesSelectedPeriod(installment.dueDateRaw)
                )
                .map((installment) => ({
                    expense,
                    installment
                }))
        )
        .sort((itemA, itemB) =>
            new Date(itemA.installment.dueDateRaw) -
            new Date(itemB.installment.dueDateRaw)
        );

    if (periodInstallments.length === 0) {
        list.innerHTML = `
            <p style="color:#6B7280; font-size:0.9rem;">
                No hay facturas para ${getSelectedPeriodLabel()}
            </p>
        `;

        return;
    }

    list.innerHTML = periodInstallments.map(({ expense, installment }) => {
        const date = new Date(
            `${installment.dueDateRaw}T00:00:00`
        );

        const month = date
            .toLocaleDateString("es-ES", { month: "short" })
            .toUpperCase();

        const day = date.getDate();

        const paidClass = installment.statusId === 2
            ? "factura-completada"
            : "";

        return `
            <article
                class="factura-card clickable-row ${paidClass}"
                data-id="${expense.id}"
                data-detail="${expense.detail}"
                data-total-installments="${expense.totalInstallments}"
                data-paid-installments="${expense.paidInstallments}"
                data-next-installment="${installment.installmentNumber}"
                data-next-due-date="${installment.dueDateRaw}"
                data-installment-amount="${expense.installmentAmount}"
                data-total="${expense.total}"
                data-completed="${expense.completed}"
            >
                <div class="factura-fecha factura-fecha-gris">
                    <span>${month}</span>
                    <strong>${day}</strong>
                </div>

                <div class="factura-info">
                    <h3>${expense.detail}</h3>
                    <p>
                        Cuota ${installment.installmentNumber}
                        de ${expense.totalInstallments}
                    </p>
                </div>

                <div class="factura-monto">
                    <strong>${expense.installmentAmount}</strong>
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll(".clickable-row").forEach((card) => {
        card.addEventListener("click", () => {
            if (card.dataset.completed === "true") return;

            openExpenseDetail(card.dataset);
        });
    });
}

async function loadEditTransactionCategories() {
    const select = document.getElementById("edit-category-drop");
    if (!select) return;
    select.innerHTML = `<option value="">Seleccionar</option>`;
    try {
        const res = await fetchWithAuth("http://localhost:8000/parameters/parameters?parameters=transactionCategories");
        if (!res.ok) return;
        const data = await res.json();
        const t = recentTransactions.find(t => t.id === currentEditTransactionId);
        data.result.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = formatParameterLabel(cat.value);
            if (cat.value === t?.category) option.selected = true;
            select.appendChild(option);
        });
    } catch (err) { console.error(err); }
}

async function loadEditTransactionTypes() {
    const select = document.getElementById("edit-transaction-type-drop");
    if (!select) return;
    select.innerHTML = `<option value="">Seleccionar</option>`;
    try {
        const res = await fetchWithAuth("http://localhost:8000/parameters/parameters?parameters=transactionTypes");
        if (!res.ok) return;
        const data = await res.json();
        const t = recentTransactions.find(t => t.id === currentEditTransactionId);
        data.result.forEach(type => {
            const option = document.createElement("option");
            option.value = type.id;
            option.textContent = formatParameterLabel(type.value);
            if (type.value === t?.type) option.selected = true;
            select.appendChild(option);
        });
    } catch (err) { console.error(err); }
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

function amountInstallment() {
    const amountRaw = document.getElementById("amount-exp").value;
    const installments = document.getElementById("installment-number-exp").value;
    const installmentAmountInput = document.getElementById("installment-amount-exp");

    if (!amountRaw || !installments || Number(installments) <= 0) {
        installmentAmountInput.value = "";
        return;
    }

    const amount = parseTransactionAmount(amountRaw);
    const cuota = amount / Number(installments);
    
    let parteEntera = Math.floor(cuota).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    let parteDecimal = (cuota % 1).toFixed(2).slice(2);
    installmentAmountInput.value = `${parteEntera},${parteDecimal}`;
}

function openExpenseDetail(dataset) {
    const { id, detail, totalInstallments, paidInstallments, nextInstallment, nextDueDate, installmentAmount, total, completed } = dataset;
    currentExpenseId = id;

    document.getElementById("expense-detail").textContent = detail;
    document.getElementById("expense-startdate").textContent = nextDueDate || "Completado";
    document.getElementById("expense-installments").textContent = `${paidInstallments} de ${totalInstallments} cuotas`;
    document.getElementById("expense-intallments-amount").textContent = installmentAmount ?? "-";
    document.getElementById("expense-total-amount").textContent = total ?? "-";

    const btnDeleteEx = document.getElementById("btnDeleteEx");
    if (btnDeleteEx) btnDeleteEx.disabled = false;

    ModalManager.open("modalEditExpenses");
}

async function loadGroupDebts(accountId) {
    const section = document.getElementById("debts-component");
    const container = document.getElementById("debts-container");
    if (!section || !container) return;

    const month = selectedFilterMonth;
    const year = selectedFilterYear;

    try {
        // 1. Obtener deudas
        const res = await fetchWithAuth(
            `http://localhost:8000/transactions/group-settlement/${accountId}?month=${month}&year=${year}`
        );

        if (!res.ok) {
            container.innerHTML = `<p style="color:#6B7280;">No se pudieron cargar las deudas.</p>`;
            return;
        }

        const data = await res.json();

        if (!data.debts || data.debts.length === 0) {
            container.innerHTML = `<p style="color:#6B7280;">No hay deudas para este período.</p>`;
            return;
        }

        // 2. Obtener IDs únicos
        const userIds = [...new Set([
            ...data.debts.map(d => d.from_user_id),
            ...data.debts.map(d => d.to_user_id)
        ])];

        // 3. Obtener nombres desde /users/by_id
        const userMap = {};

        await Promise.all(
            userIds.map(async (id) => {
                try {
                    const r = await fetchWithAuth(
                        `http://localhost:8000/users/by_id?id=${id}`
                    );

                    if (r.ok) {
                        const u = await r.json();
                        userMap[id] = `${u.name} ${u.last_name}`;
                    } else {
                        userMap[id] = `Usuario ${id}`;
                    }
                } catch {
                    userMap[id] = `Usuario ${id}`;
                }
            })
        );

        // 4. Renderizar tarjetas
        container.innerHTML = data.debts.map(debt => {
            const fromName = userMap[debt.from_user_id];
            const toName = userMap[debt.to_user_id];
            const fromInitial = fromName.charAt(0).toUpperCase();
            const toInitial = toName.charAt(0).toUpperCase();
            const amount = formatTransactionMoney(parseFloat(debt.amount));

            return `
                <div class="debts-card">
                    <div class="user-debts">
                        <div class="debts-avatar">${fromInitial}</div>
                        <span class="debts-name">${fromName}</span>
                    </div>
                    <div class="arrow-debts">
                        <span>→</span>
                        <span class="debts-ammount">${amount}</span>
                    </div>
                    <div class="user-debts">
                        <div class="debts-avatar">${toInitial}</div>
                        <span class="debts-name">${toName}</span>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error cargando deudas:", err);
        container.innerHTML = `<p style="color:#6B7280;">Error al conectar con el servidor.</p>`;
    }
}
