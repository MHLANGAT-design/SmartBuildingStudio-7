// src/modules/DaliProgrammingStudio/models/DeviceCapabilityProfile.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

export class DeviceCapabilityProfile {
  constructor(private readonly device: DaliDeviceDefinition) {}

  public canConfigureMinMax(): boolean {
    return this.device.role === 'CONTROL_GEAR';
  }

  public canConfigureGroups(): boolean {
    return this.device.role === 'CONTROL_GEAR';
  }

  public canConfigureScenes(): boolean {
    return this.device.role === 'CONTROL_GEAR';
  }

  public supportsD4i(): boolean {
    return (this.device.d4iTypes?.length ?? 0) > 0;
  }
}