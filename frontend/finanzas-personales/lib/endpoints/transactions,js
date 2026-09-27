import { fetchWithAuth } from "@/lib/api";

export async function getTransactions(accountId) {
  return fetchWithAuth(`/transactions/account/${accountId}`);
}

export async function createTransaction(payload) {
  return fetchWithAuth("/transactions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(payload) {
  return fetchWithAuth("/transactions/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deactivateTransaction(transactionId) {
  return fetchWithAuth(`/transactions/deactivate/${transactionId}`, {
    method: "PUT",
  });
}

// La usan tanto TransactionsTable como MembersPanel/DebtsPanel
export async function getGroupSettlement(accountId, month, year) {
  return fetchWithAuth(
    `/transactions/group-settlement/${accountId}?month=${month}&year=${year}`
  );
}