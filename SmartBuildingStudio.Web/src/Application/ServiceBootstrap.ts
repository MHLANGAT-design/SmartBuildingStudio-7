// src/Application/ServiceBootstrap.ts
//
// Wires module-level service singletons at app startup.
//
// Why this exists:
//   FixturePlacementStudio's store/selectors expose a swappable
//   photometric resolver via setPhotometricResolver(). It defaults to
//   the stub so tests and offline UI work don't need a backend. In a
//   real deployment, main.tsx imports this file and runs bootstrap()
//   before rendering, wiring the real ProductCatalogService client.
//
// Idempotent: safe to call more than once (dev hot-reload).

import { setPhotometricResolver } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { createProductCatalogPhotometricResolver } from '@/modules/FixturePlacementStudio/services/ProductCatalogPhotometricResolver';
import { createStubDistributionResolver } from '@/modules/FixturePlacementStudio/services/PhotometricService';

let didBootstrap = false;

export function bootstrap(): void {
  if (didBootstrap) return;
  didBootstrap = true;

  const useStub = import.meta.env.VITE_USE_STUB_PHOTOMETRIC === 'true';

  if (useStub) {
    // eslint-disable-next-line no-console
    console.info(
      '[bootstrap] Using STUB photometric resolver — no ProductCatalogService calls will be made.'
    );
    setPhotometricResolver(createStubDistributionResolver());
    return;
  }

  // eslint-disable-next-line no-console
  console.info('[bootstrap] Wiring photometric resolver to ProductCatalogService.');

  setPhotometricResolver(createProductCatalogPhotometricResolver());
}