import { apiFetch, setToken } from "@/lib/api";

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const res = await apiFetch("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (res.ok) {
    const data = await res.json();
    setToken(data.access_token);
  }

  return res;
}

export async function signup(payload) {
  return apiFetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function forgetPassword(email) {
  return apiFetch("/auth/forget-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ secretToken, newPassword, confirmPassword }) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret_token: secretToken,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}