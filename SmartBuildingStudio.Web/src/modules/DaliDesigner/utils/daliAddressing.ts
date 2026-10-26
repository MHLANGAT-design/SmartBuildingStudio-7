export const DALI_ADDRESS_MIN = 0;
export const DALI_ADDRESS_MAX = 63;

export function formatAddress(n: number | null): string {
  return n == null ? "—" : n.toString().padStart(3, "0");
}