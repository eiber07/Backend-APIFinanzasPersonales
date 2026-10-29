"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";
import { getCurrentUser } from "@/lib/endpoints/users";
import { getUserAccounts, deactivateAccount } from "@/lib/endpoints/accounts";
import { useAlerts } from "@/components/AlertProvider";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { usePlannedExpenses } from "@/lib/hooks/usePlannedExpenses";
import { useMembers } from "@/lib/hooks/useMembers";
import PeriodFilter from "@/components/PeriodFilter";

import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import MembersPanel from "@/components/MembersPanel";
import TransactionsView from "@/components/TransactionsView";
import FinancialHealthView from "@/components/FinancialHealthView";

import TransactionDetailModal from "@/components/TransactionDetailModal";
import NewTransactionModal from "@/components/NewTransactionModal";
import PlannedExpensesModal from "@/components/PlannedExpensesModal";
import ExpenseDetailModal from "@/components/ExpenseDetailModal";
import NewExpenseModal from "@/components/NewExpenseModal";
import AddMemberModal from "@/components/AddMemberModal";
import MemberInfoModal from "@/components/MemberInfoModal";
import TransactionCategoriesModal from "@/components/TransactionCategoriesModal";

function isGroupAccount(account) {
  return String(account?.account_type || "").trim().toLowerCase() === "grupal";
}

export default function DashboardPage() {
  const router = useRouter();
  const { showSuccess, showError } = useAlerts();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("financial-health");
  const [healthDataVersion, setHealthDataVersion] = useState(0);

  const [selectedFilterMonth, setSelectedFilterMonth] = useState(new Date().getMonth() + 1);
  const [selectedFilterYear, setSelectedFilterYear] = useState(new Date().getFullYear());

  const isGroup = isGroupAccount(activeAccount);

  // ---- Datos compartidos por varios componentes y modales ----
  const {
    transactions,
    filteredTransactions,
    loading: transactionsLoading,
    refetch: refetchTransactions,
  } = useTransactions(activeAccount?.id, selectedFilterMonth, selectedFilterYear);

  const {
    plannedExpenses,
    loading: plannedExpensesLoading,
    refetch: refetchPlannedExpenses,
  } = usePlannedExpenses(activeAccount?.id);

  const {
    members,
    loading: membersLoading,
    refetch: refetchMembers,
  } = useMembers(isGroup ? activeAccount?.id : null, selectedFilterMonth, selectedFilterYear);

  // ---- Estado de los modales ----
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
  const [transactionCategoriesOpen, setTransactionCategoriesOpen] = useState(false);
  const [categoriesVersion, setCategoriesVersion] = useState(0);

  const [plannedExpensesModalOpen, setPlannedExpensesModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseDetailOpen, setExpenseDetailOpen] = useState(false);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberInfoOpen, setMemberInfoOpen] = useState(false);

  // ---- Carga inicial: usuario + cuentas ----
  const loadCurrentUser = useCallback(async () => {
    if (!getToken()) {
      router.push("/login");
      return null;
    }
    try {
      const res = await getCurrentUser();
      if (res.status === 401) {
        clearToken();
        router.push("/login");
        return null;
      }
      return await res.json();
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      return null;
    }
  }, [router]);

  const loadUserAccounts = useCallback(async () => {
    try {
      const res = await getUserAccounts();
      if (!res.ok) throw new Error("No se pudieron cargar las cuentas.");
      const data = await res.json();
      const ordered = [...data].sort((a, b) => {
        const aPersonal = String(a.account_type || "").toLowerCase() === "personal";
        const bPersonal = String(b.account_type || "").toLowerCase() === "personal";
        return Number(bPersonal) - Number(aPersonal);
      });
      setAccounts(ordered);
      return ordered;
    } catch (error) {
      console.error("Error cargando cuentas:", error);
      showError("No se pudieron cargar tus cuentas.");
      return [];
    }
  }, [showError]);

  useEffect(() => {
    (async () => {
      const currentUser = await loadCurrentUser();
      if (!currentUser) return;
      setUser(currentUser);
      const loadedAccounts = await loadUserAccounts();
      if (loadedAccounts.length > 0) setActiveAccount(loadedAccounts[0]);
      setLoading(false);
    })();
  }, [loadCurrentUser, loadUserAccounts]);

  function handleSelectAccount(account) {
    setActiveAccount(account);
    setActiveView("financial-health");
  }

  async function handleAccountCreated() {
    const refreshed = await loadUserAccounts();
    if (!activeAccount && refreshed.length > 0) {
      setActiveAccount(refreshed[0]);
      setActiveView("financial-health");
    }
  }

  function handlePeriodChange(month, year) {
    setSelectedFilterMonth(month);
    setSelectedFilterYear(year);
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (!activeAccount) return;
    try {
      const res = await deactivateAccount(activeAccount.id);
      if (res.ok) {
        showSuccess("Cuenta eliminada correctamente.");
        setActiveAccount(null);
        await loadUserAccounts();
      } else {
        const err = await res.json();
        showError(err.detail || "No se pudo eliminar la cuenta.");
      }
    } catch {
      showError("No se pudo conectar con el servidor.");
    }
  }

  // ---- Handlers de transacciones ----
  function handleTransactionRowClick(transaction) {
    setSelectedTransaction(transaction);
    setTransactionDetailOpen(true);
  }

  function handleTransactionChanged() {
    refetchTransactions();
    refetchPlannedExpenses();
    if (isGroup) refetchMembers();
    setHealthDataVersion((version) => version + 1);
  }

  function handleTransactionCreated() {
    refetchTransactions();
    refetchPlannedExpenses();
    if (isGroup) refetchMembers();
    setHealthDataVersion((version) => version + 1);
  }

  function handleExpenseCardClick(expense) {
    setSelectedExpense(expense);
    setExpenseDetailOpen(true);
  }

  function handleOpenPlan(plannedExpenseId) {
    const expense = plannedExpenses.find((e) => e.id === String(plannedExpenseId));
    if (!expense) {
      showError("No se encontró el pago asociado.");
      return;
    }
    setTransactionDetailOpen(false);
    setSelectedExpense(expense);
    setExpenseDetailOpen(true);
  }

  function handleExpenseDeleted() {
    refetchPlannedExpenses();
    refetchTransactions();
    if (isGroup) refetchMembers();
    setHealthDataVersion((version) => version + 1);
  }

  function handleExpenseCreated() {
    refetchPlannedExpenses();
    refetchTransactions();
    if (isGroup) refetchMembers();
    setHealthDataVersion((version) => version + 1);
  }

  // ---- Handlers de participantes ----
  function handleMemberClick(member) {
    setSelectedMember(member);
    setMemberInfoOpen(true);
  }

  function handleMemberAdded() {
    refetchMembers();
  }

  function handleMemberDeleted() {
    refetchMembers();
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <div className="grid-contenedor">
      <DashboardHeader
        activeAccount={activeAccount}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
        onMenuClick={() => setMobileMenuOpen(true)}
        menuOpen={mobileMenuOpen}
      />

      <Sidebar
        user={user}
        accounts={accounts}
        activeAccountId={activeAccount?.id}
        onSelectAccount={handleSelectAccount}
        onAccountCreated={handleAccountCreated}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="componente-main">
        {!activeAccount ? (
          <p>No tenés cuentas todavía. Creá una desde el menú lateral.</p>
        ) : (
          <>
            {/* Barra superior con Filtro de Período y Participantes si es grupal */}
            <div className="dashboard-toolbar">
              {isGroup && (
                <MembersPanel
                  members={members}
                  loading={membersLoading}
                  currentUser={user}
                  onAddMemberClick={() => setAddMemberOpen(true)}
                  onMemberClick={handleMemberClick}
                />
              )}
              <div className="dashboard-period-filter">
                <PeriodFilter
                  month={selectedFilterMonth}
                  year={selectedFilterYear}
                  onChange={handlePeriodChange}
                />
              </div>
            </div>

            <div className="dashboard-view-switch" role="tablist" aria-label="Vistas de la cuenta">
              <button
                type="button"
                role="tab"
                id="financial-health-tab"
                aria-selected={activeView === "financial-health"}
                aria-controls="financial-health-panel"
                className={activeView === "financial-health" ? "active" : ""}
                onClick={() => setActiveView("financial-health")}
              >
                Salud financiera
              </button>
              <button
                type="button"
                role="tab"
                id="transactions-tab"
                aria-selected={activeView === "transactions"}
                aria-controls="transactions-panel"
                className={activeView === "transactions" ? "active" : ""}
                onClick={() => setActiveView("transactions")}
              >
                Transacciones
              </button>
            </div>

            {isGroup && (
              <DebtsPanel
                accountId={activeAccount.id}
                month={selectedFilterMonth}
                year={selectedFilterYear}
              />
            )}

            <section className="componente-main2">
              <section className="componente-transacciones">
                <TransactionsTable
                  filteredTransactions={filteredTransactions}
                  loading={transactionsLoading}
                  isGroup={isGroup}
                  month={selectedFilterMonth}
                  year={selectedFilterYear}
                  onRowClick={handleTransactionRowClick}
                  onAddClick={() => setNewTransactionOpen(true)}
                  onManageCategoriesClick={() => setTransactionCategoriesOpen(true)}
                />

              </section>

              <div className={`columna-derecha ${isGroup ? "cuenta-grupal" : ""}`}>
                <PlannedExpensesPreview
                  plannedExpenses={plannedExpenses}
                  plannedExpensesLoading={plannedExpensesLoading}
                  onNewExpense={() => setNewExpenseOpen(true)}
                  onManageExpenses={() => setPlannedExpensesModalOpen(true)}
                  onExpenseClick={handleExpenseCardClick}
                />
              </div>

              {/* COLUMNA DERECHA: Tabla de Transacciones */}
              <div className="columna-derecha-tabla">
                <TransactionsTable
                  filteredTransactions={filteredTransactions}
                  loading={transactionsLoading}
                  isGroup={isGroup}
                  month={selectedFilterMonth}
                  year={selectedFilterYear}
                  onRowClick={handleTransactionRowClick}
                  onAddClick={() => setNewTransactionOpen(true)}
                  onManageCategoriesClick={() => setTransactionCategoriesOpen(true)}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ---- Modales de transacciones ---- */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={transactionDetailOpen}
        accountId={activeAccount?.id}
        isGroup={isGroup}
        categoriesVersion={categoriesVersion}
        onClose={() => setTransactionDetailOpen(false)}
        onChanged={handleTransactionChanged}
        onOpenPlan={handleOpenPlan}
        hasActivePlan={
          Boolean(selectedTransaction?.plannedExpenseId) &&
          plannedExpenses.some((e) => e.id === selectedTransaction.plannedExpenseId)
        }
      />

      <NewTransactionModal
        open={newTransactionOpen}
        onClose={() => setNewTransactionOpen(false)}
        accountId={activeAccount?.id}
        isGroup={isGroup}
        categoriesVersion={categoriesVersion}
        members={members}
        currentUser={user}
        onCreated={handleTransactionCreated}
      />

      {/* ---- Modales de gastos planificados ---- */}
      <PlannedExpensesModal
        open={plannedExpensesModalOpen}
        onClose={() => setPlannedExpensesModalOpen(false)}
        plannedExpenses={plannedExpenses}
        loading={plannedExpensesLoading}
        onRowClick={(expense) => {
          setPlannedExpensesModalOpen(false);
          handleExpenseCardClick(expense);
        }}
      />

      <ExpenseDetailModal
        expense={selectedExpense}
        open={expenseDetailOpen}
        onClose={() => setExpenseDetailOpen(false)}
        onDeleted={handleExpenseDeleted}
        transactions={transactions}
      />

      <NewExpenseModal
        open={newExpenseOpen}
        onClose={() => setNewExpenseOpen(false)}
        accountId={activeAccount?.id}
        isGroup={isGroup}
        categoriesVersion={categoriesVersion}
        onCreated={handleExpenseCreated}
      />

      <TransactionCategoriesModal
        open={transactionCategoriesOpen}
        onClose={() => setTransactionCategoriesOpen(false)}
        accountId={activeAccount?.id}
        accountName={activeAccount?.name}
        isGroup={isGroup}
        onChanged={() => setCategoriesVersion((version) => version + 1)}
      />

      {/* ---- Modales de participantes (cuentas grupales) ---- */}
      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        accountId={activeAccount?.id}
        onAdded={handleMemberAdded}
      />

      <MemberInfoModal
        member={selectedMember}
        open={memberInfoOpen}
        onClose={() => setMemberInfoOpen(false)}
        accountId={activeAccount?.id}
        onDeleted={handleMemberDeleted}
      />
    </div>
  );
}