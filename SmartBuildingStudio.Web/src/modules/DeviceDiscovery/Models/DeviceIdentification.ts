// src/modules/DeviceDiscovery/Models/DeviceIdentification.ts

/**
 * Frontend model for the identification result of a single discovered device.
 *
 * Identification is the step where the gateway queries the device for its
 * manufacturer, firmware, device type, and capabilities. It is distinct from
 * matching (which compares identified devices to the ProjectExplorer design).
 */

export type IdentificationStatus =
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PARTIAL';

export interface DeviceIdentification {
  identificationId: string;
  deviceId: string;
  sessionId: string;
  status: IdentificationStatus;
  /** Fields filled in by the gateway during identification. */
  manufacturer: string | null;
  firmwareVersion: string | null;
  deviceType: string | null;
  /** Capability names reported by the device (deduped, in report order). */
  capabilities: string[];
  /** Serial number / GTIN / other identifiers reported by the device. */
  serialNumber: string | null;
  gtin: string | null;
  /** Error message if status === 'FAILED'. */
  errorMessage: string | null;
  /** ISO-8601 timestamps. */
  requestedAt: string;
  completedAt: string | null;
}

export const createEmptyIdentification = (
  partial: Partial<DeviceIdentification> & { identificationId: string; deviceId: string; sessionId: string }
): DeviceIdentification => ({
  identificationId: partial.identificationId,
  deviceId: partial.deviceId,
  sessionId: partial.sessionId,
  status: partial.status ?? 'PENDING',
  manufacturer: partial.manufacturer ?? null,
  firmwareVersion: partial.firmwareVersion ?? null,
  deviceType: partial.deviceType ?? null,
  capabilities: partial.capabilities ?? [],
  serialNumber: partial.serialNumber ?? null,
  gtin: partial.gtin ?? null,
  errorMessage: partial.errorMessage ?? null,
  requestedAt: partial.requestedAt ?? new Date().toISOString(),
  completedAt: partial.completedAt ?? null,
});