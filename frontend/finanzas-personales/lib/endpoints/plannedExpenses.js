import { fetchWithAuth } from "@/lib/api";

export async function getPlannedExpenses(accountId) {
  return fetchWithAuth(`/planned_expenses/account/${accountId}`);
}

export async function createPlannedExpense(payload) {
  return fetchWithAuth("/planned_expenses/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivatePlannedExpense(expenseId) {
  return fetchWithAuth(`/planned_expenses/deactivate/${expenseId}`, {
    method: "PUT",
  });
}