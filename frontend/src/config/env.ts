/**
 * API base URL (no trailing slash).
 * Dev: use `/api` with Vite proxy to FastAPI.
 * Prod: set VITE_API_BASE_URL=https://your-api.example.com
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.replace(/\/+$/, "");
  }
  return "/api";
}
