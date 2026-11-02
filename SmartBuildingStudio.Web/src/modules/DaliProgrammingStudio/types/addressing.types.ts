// src/modules/DaliProgrammingStudio/types/addressing.types.ts

/**
 * Represents a physical device discovered on the bus during a scan.
 */
export interface DiscoveredDevice {
  hardwareAddress: number;
  deviceType: number;
  randomAddress: string; // 24-bit random address
  currentShortAddress: number | null;
}

/**
 * The mapping between a design device and a physical hardware address.
 */
export interface AddressMapping {
  deviceId: string;
  assignedShortAddress: number;
  lineId: string;
}

/**
 * Details of an address conflict.
 */
export interface AddressConflict {
  shortAddress: number;
  conflictingDeviceIds: string[];
  reason: 'DUPLICATE_SHORT_ADDRESS' | 'MISSING_DEVICE' | 'UNEXPECTED_DEVICE';
}

/**
 * The result of the address allocation and assignment process.
 */
export interface AddressingResult {
  mappings: AddressMapping[];
  conflicts: AddressConflict[];
  requiresResolution: boolean;
}