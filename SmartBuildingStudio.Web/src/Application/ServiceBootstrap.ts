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
//   This is also where GatewayManagement's gateway list is fetched once
//   at boot, so every module that needs gateways (DeviceDiscovery, future
//   Reports, Commissioning's GatewayIntegrationPanel) has data without a
//   per-page fetch. The fetch is fire-and-forget — a failure writes to
//   the gatewayManagement.errors.gateways slot and does not block the app.
//
// Idempotent: safe to call more than once (dev hot-reload).

import { setPhotometricResolver } from '@/modules/FixturePlacementStudio/store/fixtureSelectors';
import { createProductCatalogPhotometricResolver } from '@/modules/FixturePlacementStudio/services/ProductCatalogPhotometricResolver';
import { createStubDistributionResolver } from '@/modules/FixturePlacementStudio/services/PhotometricService';
import { store } from '@/Application/ConfigureStore';
import { fetchGateways } from '@/modules/GatewayManagement';

let didBootstrap = false;

export function bootstrap(): void {
  if (didBootstrap) return;
  didBootstrap = true;

  /* ------------------------------------------------------------------ */
  /* Gateway list — fetched once at app boot                            */
  /* ------------------------------------------------------------------ */
  // Fire-and-forget. If GatewayManagement is unreachable, the thunk
  // writes to gatewayManagement.errors.gateways; the app continues to
  // render, and the GatewayManagement page retries on its own mount.
  void store
    .dispatch(fetchGateways())
    .catch(() => {
      /* error slot already populated by the thunk — do not throw */
    });

  /* ------------------------------------------------------------------ */
  /* Photometric resolver                                                */
  /* ------------------------------------------------------------------ */
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