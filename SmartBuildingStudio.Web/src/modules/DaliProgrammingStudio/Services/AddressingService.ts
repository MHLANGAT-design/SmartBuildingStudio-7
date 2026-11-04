// src/modules/DaliProgrammingStudio/Services/AddressingService.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { AddressingResult } from '@/modules/DaliProgrammingStudio/Addressing/AddressingResult';
import { AddressingManager } from '@/modules/DaliProgrammingStudio/Addressing/AddressingManager';
import { CommissioningApi } from '@/modules/Commissioning/services/CommissioningApi';

export class AddressingService {
  private manager = new AddressingManager();

  /**
   * Pure data transformation — compute the addressing plan.
   * Stays in the frontend because it doesn't touch physical hardware.
   */
  public planAddressing(devices: DaliDeviceDefinition[]): AddressingResult {
    return this.manager.planAddressing(devices);
  }

  /**
   * Build DALI command sequences for preview.
   */
  public buildAddressingSequences(result: AddressingResult) {
    return this.manager.buildAddressingSequences(result);
  }

  /**
   * Write an address to a device on the physical gateway.
   * Uses /addressing/reprogram because the programming module can
   * re-address devices at any time (bypasses the state machine).
   */
  public async assignAddress(
    sessionId: string,
    deviceExternalId: string,
    address: number,
  ): Promise<{ deviceExternalId: string; shortAddress: number; isVerified: boolean }> {
    if (!sessionId) {
      throw new Error('Cannot assign address: no active commissioning session.');
    }
    return CommissioningApi.reprogramAddress(deviceExternalId, address, sessionId);
  }

  /**
   * Assign an address as part of the initial commissioning workflow.
   * Requires the session to be in ADDRESSING state.
   */
  public async assignAddressForCommissioning(
    sessionId: string,
    deviceExternalId: string,
    address: number,
  ): Promise<{ deviceExternalId: string; shortAddress: number; isVerified: boolean }> {
    if (!sessionId) {
      throw new Error('Cannot assign address: no active commissioning session.');
    }
    return CommissioningApi.assignAddress(deviceExternalId, address, sessionId);
  }
}