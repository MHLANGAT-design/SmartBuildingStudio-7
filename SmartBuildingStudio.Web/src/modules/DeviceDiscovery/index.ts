// src/modules/DeviceDiscovery/index.ts

/**
 * DeviceDiscovery module — public surface.
 *
 * Consumers (other modules, the app shell, ConfigureStore) import from this
 * barrel only. Internal folders (Engine, Services, Utilities, Store internals)
 * are NOT re-exported here — if another module needs them, that's a sign the
 * boundary is wrong.
 *
 * Usage:
 *   import { DeviceDiscoveryPage, deviceDiscoveryReducer } from '@/modules/DeviceDiscovery';
 *   import { useDeviceDiscovery } from '@/modules/DeviceDiscovery';
 *   import type { DiscoverySession } from '@/modules/DeviceDiscovery';
 */

/* ------------------------------------------------------------------ */
/* Page + reducer (app-shell integration)                              */
/* ------------------------------------------------------------------ */

export { DeviceDiscoveryPage } from '@/modules/DeviceDiscovery/DeviceDiscoveryPage';
export { default as DeviceDiscoveryPageDefault } from '@/modules/DeviceDiscovery/DeviceDiscoveryPage';

export {
  deviceDiscoveryReducer,
  default as deviceDiscoveryReducerDefault,
} from '@/modules/DeviceDiscovery/Store/deviceDiscoverySlice';

/* ------------------------------------------------------------------ */
/* Public hooks                                                        */
/* ------------------------------------------------------------------ */

export { useDeviceDiscovery } from '@/modules/DeviceDiscovery/Hooks/useDeviceDiscovery';
export type { UseDeviceDiscoveryReturn } from '@/modules/DeviceDiscovery/Hooks/useDeviceDiscovery';

export { useDiscoverySession } from '@/modules/DeviceDiscovery/Hooks/useDiscoverySession';
export type { UseDiscoverySessionReturn } from '@/modules/DeviceDiscovery/Hooks/useDiscoverySession';

export { useDiscoveredDevices } from '@/modules/DeviceDiscovery/Hooks/useDiscoveredDevices';
export type {
  UseDiscoveredDevicesReturn,
  DeviceFilterState,
} from '@/modules/DeviceDiscovery/Hooks/useDiscoveredDevices';

export { useDeviceIdentification } from '@/modules/DeviceDiscovery/Hooks/useDeviceIdentification';
export type { UseDeviceIdentificationReturn } from '@/modules/DeviceDiscovery/Hooks/useDeviceIdentification';

export { useDiscoveryProgress } from '@/modules/DeviceDiscovery/Hooks/useDiscoveryProgress';
export type {
  UseDiscoveryProgressReturn,
  UseDiscoveryProgressOptions,
} from '@/modules/DeviceDiscovery/Hooks/useDiscoveryProgress';

/* ------------------------------------------------------------------ */
/* Workflow (public orchestration entry point)                         */
/* ------------------------------------------------------------------ */

export {
  deviceDiscoveryWorkflow,
  WorkflowCancelledError,
} from '@/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow';
export type {
  WorkflowContext,
  WorkflowAbortSignal,
  DeviceDiscoveryWorkflowInput,
  DeviceDiscoveryWorkflowResult,
} from '@/modules/DeviceDiscovery/Workflows/deviceDiscoveryWorkflow';

/* ------------------------------------------------------------------ */
/* Public models (shapes other modules may pass or receive)            */
/* ------------------------------------------------------------------ */

export type {
  DiscoverySession,
  DiscoverySessionStatus,
  DiscoveryPhase,
  DiscoverySessionScope,
  DiscoverySessionProgress,
} from '@/modules/DeviceDiscovery/Models/DiscoverySession';

export type {
  DiscoveredDevice,
  DiscoveredDeviceStatus,
  DaliDeviceType,
} from '@/modules/DeviceDiscovery/Models/DiscoveredDevice';

export type {
  DeviceIdentification,
  IdentificationStatus,
} from '@/modules/DeviceDiscovery/Models/DeviceIdentification';

export type {
  DeviceCapabilities,
  KnownCapability,
} from '@/modules/DeviceDiscovery/Models/DeviceCapabilities';

export type {
  DiscoveryResult,
  DiscoveryResultCounts,
  DiscoveryException,
  DiscoveryExceptionKind,
} from '@/modules/DeviceDiscovery/Models/DiscoveryResult';

export type {
  DeviceMatch,
  DeviceMatchDiscrepancy,
  MatchStatus,
  DiscrepancyKind,
} from '@/modules/DeviceDiscovery/Models/DeviceMatch';

/**
 * DesignFixture is the *input* type for matching — ProjectExplorer data
 * reaches DeviceDiscovery through this shape. Exported because the caller
 * (the page, or a higher-order workflow) must construct it.
 */
export type { DesignFixture } from '@/modules/DeviceDiscovery/Engine/DeviceMatchingEngine';

/* ------------------------------------------------------------------ */
/* Public utilities (pure, no side effects)                            */
/* ------------------------------------------------------------------ */

/**
 * Address formatting is used by other modules' reports / inspectors that
 * display a discovered device — export the formatters, not the parsers.
 */
export {
  formatShortAddress,
  formatRandomAddress,
  formatDeviceAddress,
} from '@/modules/DeviceDiscovery/Utilities/deviceAddressUtils';

/**
 * Result summarization is used by the Reports module when it consumes
 * discovery results.
 */
export {
  summarizeResult,
  summarizeMatches,
  matchRate,
  exceptionRate,
} from '@/modules/DeviceDiscovery/Utilities/discoveryResultUtils';