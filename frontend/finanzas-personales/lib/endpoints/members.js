import { fetchWithAuth } from "@/lib/api";

export async function getMembers(accountId) {
  return fetchWithAuth(`/accounts/${accountId}/members`);
}

export async function addMember(accountId, email) {
  return fetchWithAuth(`/accounts/${accountId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function deleteMember(accountId, userId) {
  return fetchWithAuth(`/accounts/${accountId}/members/${userId}`, {
    method: "DELETE",
  });
}