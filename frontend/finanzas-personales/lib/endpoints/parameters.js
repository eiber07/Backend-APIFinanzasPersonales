import { fetchWithAuth } from "@/lib/api";

export async function getParameters(type) {
  return fetchWithAuth(`/parameters/parameters?parameters=${type}`);
}

export async function getTransactionCategories() {
  return fetchWithAuth("/transaction-categories/");
}

export async function createTransactionCategory(payload) {
  return fetchWithAuth("/transaction-categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTransactionCategory(categoryId, payload) {
  return fetchWithAuth(`/transaction-categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTransactionCategory(categoryId) {
  return fetchWithAuth(`/transaction-categories/${categoryId}`, {
    method: "DELETE",
  });
}