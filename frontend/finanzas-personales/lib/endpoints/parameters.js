import { fetchWithAuth } from "@/lib/api";

export async function getParameters(type) {
  return fetchWithAuth(`/parameters/parameters?parameters=${type}`);
}