// src/modules/GatewayManagement/Services/apiConfig.ts

/**
 * Shared configuration for the GatewayManagement frontend service layer.
 *
 * The backend runs at http://localhost:5100 (verified end-to-end). The
 * Vite proxy forwards /api/v1/gateways and /api/v1/gateway-integration to
 * that URL. When the frontend is served from Vite dev (port 5173), the
 * proxy handles the cross-origin hop; when it's served from any other
 * origin, API_BASE_URL can be overridden with VITE_GATEWAY_MANAGEMENT_API_URL.
 */

/**
 * When true, all API calls short-circuit to synthetic responses. Useful
 * for developing components before the backend is running, or for
 * frontend-only tests. The GatewayManagement backend is live, so this
 * defaults to false.
 */
export const USE_MOCK: boolean = false;

/**
 * Base URL of GatewayManagementService.Api. The Vite dev server proxies
 * /api/v1/gateways and /api/v1/gateway-integration to http://127.0.0.1:5100
 * when the frontend is loaded at port 5173, so relative paths work
 * out of the box. When deployed separately, set the env var to the full
 * backend URL (including the /api prefix).
 */
export const API_BASE_URL: string =
  (import.meta as any)?.env?.VITE_GATEWAY_MANAGEMENT_API_URL ?? '';

/** Artificial latency for mock responses, in ms. No-op when USE_MOCK is false. */
export const mockDelay = (ms: number = 350): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** Current time as an ISO-8601 string. Single source of truth for timestamps. */
export const nowIso = (): string => new Date().toISOString();

/** Build a full URL from a relative path. */
export const buildUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return base ? `${base}/${rel}` : `/${rel}`;
};

/** Standard JSON fetch helper. Throws on non-2xx. */
export const jsonFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message ?? JSON.stringify(body);
    } catch {
      try {
        detail = await response.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(
      `GatewayManagement API ${response.status} ${response.statusText}` +
        (detail ? ` — ${detail}` : '')
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};