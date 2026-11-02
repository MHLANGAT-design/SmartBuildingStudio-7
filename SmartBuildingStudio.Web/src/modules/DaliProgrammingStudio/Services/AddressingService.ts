// src/modules/DaliProgrammingStudio/Services/AddressingService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { AddressingResult } from '@/modules/DaliProgrammingStudio/Addressing/AddressingResult';
import { AddressingManager } from '@/modules/DaliProgrammingStudio/Addressing/AddressingManager';

export class AddressingService {
  private manager = new AddressingManager();

  public planAddressing(devices: DaliDeviceDefinition[]): AddressingResult {
    return this.manager.planAddressing(devices);
  }

  public buildAddressingSequences(result: AddressingResult) {
    return this.manager.buildAddressingSequences(result);
  }
}