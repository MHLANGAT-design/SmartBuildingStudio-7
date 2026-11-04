// src/modules/Commissioning/services/apiConfig.ts

export const USE_MOCK = false; // <-- Set to false to use the backend
export const USE_AUTO_FIRE = true;
export const API_BASE_URL = 'http://localhost:5000'; // <-- Backend URL

export function mockDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function nowIso(): string {
  return new Date().toISOString();
}