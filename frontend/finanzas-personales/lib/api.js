export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
}

export function setToken(token) {
  window.localStorage.setItem("access_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("access_token");
}

export async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, options);
}

export async function fetchWithAuth(path, options = {}) {
  const token = getToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}