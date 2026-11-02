// src/modules/DaliProgrammingStudio/models/DaliDevice.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import { DALI_DEVICE_ROLES, DALI_DEVICE_TYPES } from '@/modules/DaliProgrammingStudio/constants/daliDeviceTypes';

export class DaliDevice {
  private readonly definition: DaliDeviceDefinition;

  constructor(definition: DaliDeviceDefinition) {
    this.definition = definition;
  }

  get id(): string { return this.definition.deviceId; }
  get hardwareAddress(): number { return this.definition.hardwareAddress; }
  get logicalName(): string { return this.definition.logicalName; }
  get raw(): DaliDeviceDefinition { return this.definition; }

  /**
   * Helper to check if this device is a control gear (e.g., LED driver).
   */
  public isControlGear(): boolean {
    return this.definition.role === DALI_DEVICE_ROLES.CONTROL_GEAR;
  }

  /**
   * Helper to check if this device is a control device (e.g., sensor).
   */
  public isControlDevice(): boolean {
    return this.definition.role === DALI_DEVICE_ROLES.CONTROL_DEVICE;
  }

  /**
   * Helper to check if the device supports a specific D4i capability.
   */
  public hasD4iCapability(capability: string): boolean {
    return this.definition.d4iTypes?.includes(capability as any) ?? false;
  }

  /**
   * Returns the expected groups as a comma-separated string for display.
   */
  public getGroupsString(): string {
    return this.definition.groups.map(g => g.name || `G${g.groupId}`).join(', ');
  }
}