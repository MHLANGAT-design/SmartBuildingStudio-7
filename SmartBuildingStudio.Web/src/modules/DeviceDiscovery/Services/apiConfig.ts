// src/modules/DeviceDiscovery/Services/apiConfig.ts

/**
 * Shared configuration for the DeviceDiscovery frontend service layer.
 *
 * Mirrors the Commissioning module's apiConfig so local dev and mock testing
 * behave identically across modules. `USE_MOCK` is the only switch — services
 * check it and return synthetic data without touching the network.
 */

/** Flip to false once the DeviceDiscovery backend is running. */
export const USE_MOCK: boolean = true;

/** Base URL of DeviceDiscoveryService.Api. */
export const API_BASE_URL: string =
  (import.meta as any)?.env?.VITE_DEVICE_DISCOVERY_API_URL ??
  'http://localhost:5102/api';

/** Artificial latency for mock responses, in ms — keeps UI loading states honest. */
export const mockDelay = (ms: number = 350): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** Current time as an ISO-8601 string. Single source of truth for timestamps. */
export const nowIso = (): string => new Date().toISOString();

/** Build a full URL from a relative path. */
export const buildUrl = (path: string): string => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return `${base}/${rel}`;
};

/** Standard JSON fetch helper used by every service. Throws on non-2xx. */
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
      detail = await response.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `DeviceDiscovery API ${response.status} ${response.statusText}` +
        (detail ? ` — ${detail}` : '')
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};