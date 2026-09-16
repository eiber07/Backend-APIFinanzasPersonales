import { fetchWithAuth } from "@/lib/api";

export async function getUserAccounts() {
  return fetchWithAuth("/accounts/user");
}

export async function createAccount({ name, description, accountTypeId }) {
  return fetchWithAuth("/accounts/", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      account_type_id: accountTypeId,
    }),
  });
}

export async function deactivateAccount(accountId) {
  return fetchWithAuth(`/accounts/deactivate/${accountId}`, { method: "PUT" });
}