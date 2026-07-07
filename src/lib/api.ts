import { auth } from "./firebase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const API_KEY = process.env.NEXT_PUBLIC_SCRYON_API_KEY ?? "";

export async function apiFetch(path: string, options?: RequestInit) {
  const token = await auth?.currentUser?.getIdToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    const error = new Error(`API ${res.status}: ${body}`) as Error & { status?: number };
    // Attach the status so callers can branch on it directly (e.g. "404 = not
    // authorized for this admin route") instead of parsing the message string.
    error.status = res.status;
    throw error;
  }

  return res;
}
