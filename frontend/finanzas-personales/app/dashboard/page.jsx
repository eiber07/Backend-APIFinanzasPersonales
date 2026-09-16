"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";
import { getCurrentUser } from "@/lib/endpoints/users";
import { getUserAccounts, deactivateAccount } from "@/lib/endpoints/accounts";
import { useAlerts } from "@/components/AlertProvider";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";

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

  const [selectedFilterMonth, setSelectedFilterMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedFilterYear, setSelectedFilterYear] = useState(
    new Date().getFullYear()
  );

  const [logoutOpen, setLogoutOpen] = useState(false);

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
      if (loadedAccounts.length > 0) {
        setActiveAccount(loadedAccounts[0]);
      }

      setLoading(false);
    })();
  }, [loadCurrentUser, loadUserAccounts]);

  function handleSelectAccount(account) {
    setActiveAccount(account);
  }

  async function handleAccountCreated() {
    const refreshed = await loadUserAccounts();
    if (!activeAccount && refreshed.length > 0) {
      setActiveAccount(refreshed[0]);
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <div className="grid-contenedor">
      <header className="componente-header">
        <div className="header-title-group">
          <h1>{activeAccount?.name || "Dashboard"}</h1>
        </div>

        <div className="logout-container">
          <button className="btn-logout" onClick={() => setLogoutOpen(true)}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <Sidebar
        user={user}
        accounts={accounts}
        activeAccountId={activeAccount?.id}
        onSelectAccount={handleSelectAccount}
        onAccountCreated={handleAccountCreated}
      />

      <main className="componente-main">
        {!activeAccount ? (
          <p>No tenés cuentas todavía. Creá una desde el menú lateral.</p>
        ) : (
          <>
            {/* ---- ZONA DE PERSONA A ---- */}
            {/* <PeriodFilter month={selectedFilterMonth} year={selectedFilterYear} onChange={handlePeriodChange} /> */}
            {/* <BalanceCards accountId={activeAccount.id} month={selectedFilterMonth} year={selectedFilterYear} /> */}
            {/* <TransactionsTable accountId={activeAccount.id} isGroup={isGroupAccount(activeAccount)} month={selectedFilterMonth} year={selectedFilterYear} /> */}

            {/* ---- ZONA DE PERSONA B ---- */}
            {/* <PlannedExpensesPreview accountId={activeAccount.id} month={selectedFilterMonth} year={selectedFilterYear} /> */}

            {isGroupAccount(activeAccount) && (
              <>
                {/* <MembersPanel accountId={activeAccount.id} currentUser={user} month={selectedFilterMonth} year={selectedFilterYear} /> */}
                {/* <DebtsPanel accountId={activeAccount.id} month={selectedFilterMonth} year={selectedFilterYear} /> */}
              </>
            )}

            <p style={{ color: "#6B7280" }}>
              Cuenta activa: <strong>{activeAccount.name}</strong> (
              {isGroupAccount(activeAccount) ? "grupal" : "personal"}) — período{" "}
              {selectedFilterMonth}/{selectedFilterYear}
            </p>
          </>
        )}
      </main>

      <Modal id="modalLogout" open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <h2>¿Cerrar sesión?</h2>
        <p>
          ¿Estás seguro de que deseas cerrar tu sesión? Deberás iniciar sesión
          nuevamente para acceder.
        </p>
        <div className="acciones-modal">
          <button className="btn-primary btn-red" onClick={handleLogout}>
            Cerrar Sesión
          </button>
          <button className="btn-secondary" onClick={() => setLogoutOpen(false)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}