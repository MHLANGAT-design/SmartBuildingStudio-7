// src/modules/Commissioning/utils/deviceMatcher.ts

export interface PhysicalDevice {
  hardwareAddress: number;
  randomAddress: string;
  type: string;
}

export interface DigitalDevice {
  deviceId: string;
  expectedAddress: number;
  productType: string;
}

export class DeviceMatcher {
  /**
   * Attempts to match a discovered physical device to a design device.
   * First by address, then by type if address is unknown.
   */
  public static matchDevice(
    physical: PhysicalDevice,
    digitalList: DigitalDevice[]
  ): DigitalDevice | null {
    // 1. Exact address match (most reliable)
    const addressMatch = digitalList.find(d => d.expectedAddress === physical.hardwareAddress);
    if (addressMatch) return addressMatch;

    // 2. Type match (fallback if addressing is wrong)
    const typeMatches = digitalList.filter(d => d.productType === physical.type);
    if (typeMatches.length === 1) return typeMatches[0];

    // Cannot confidently match
    return null;
  }

  /**
   * Finds design devices that were not discovered on the physical network.
   */
  public static findMissingDevices(
    physicalList: PhysicalDevice[],
    digitalList: DigitalDevice[]
  ): DigitalDevice[] {
    const discoveredAddresses = new Set(physicalList.map(p => p.hardwareAddress));
    return digitalList.filter(d => !discoveredAddresses.has(d.expectedAddress));
  }
}