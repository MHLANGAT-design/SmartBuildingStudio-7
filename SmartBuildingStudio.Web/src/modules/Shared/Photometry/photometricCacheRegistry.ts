// src/modules/Shared/Photometry/photometricCacheRegistry.ts
//
// Registry of photometric-cache clearers. Modules that cache photometric
// distributions register a clearer function; the upload dialog (or any
// other invalidator) calls `clearAllPhotometricCaches()` to clear them
// all without importing each module individually.
//
// This preserves module boundaries: neither FPS nor EmergencyLighting
// depends on the other. Both depend on this shared registry.

const clearers = new Set<() => void>();

export function registerPhotometricCacheClearer(fn: () => void): void {
  clearers.add(fn);
}

export function clearAllPhotometricCaches(): void {
  for (const fn of clearers) {
    try {
      fn();
    } catch (err) {
      // Defensive: a failed clearer must not block the others.
      // eslint-disable-next-line no-console
      console.warn('[photometricCacheRegistry] clearer threw', err);
    }
  }
}