import { fetchWithAuth } from "@/lib/api";

export async function getAccountBudgets(accountId) {
  return fetchWithAuth(`/budgets/account/${accountId}`);
}

export async function createBudget(payload) {
  return fetchWithAuth("/budgets/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addBudgetItem(budgetId, payload) {
  return fetchWithAuth(`/budgets/${budgetId}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBudgetItem(budgetId, itemId, payload) {
  return fetchWithAuth(`/budgets/${budgetId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBudgetItem(budgetId, itemId) {
  return fetchWithAuth(`/budgets/${budgetId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function getMonthlyDashboard(accountId, year, month) {
  return fetchWithAuth(
    `/dashboard/account/${accountId}/monthly?year=${year}&month=${month}`
  );
}
