import { fetchWithAuth } from "@/lib/api";

export async function getCurrentUser() {
  return fetchWithAuth("/users/me");
}

export async function getUserById(id) {
  return fetchWithAuth(`/users/by_id?id=${id}`);
}