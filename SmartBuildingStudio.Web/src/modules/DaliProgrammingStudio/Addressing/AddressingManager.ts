// src/modules/DaliProgrammingStudio/Addressing/AddressingManager.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { AddressingResult } from '@/modules/DaliProgrammingStudio/Addressing/AddressingResult';
import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import { AddressAssignmentService } from '@/modules/DaliProgrammingStudio/Addressing/AddressAssignmentService';
import { AddressingSequenceBuilder } from '@/modules/DaliProgrammingStudio/Addressing/AddressingSequenceBuilder';

export class AddressingManager {
  private assignmentService = new AddressAssignmentService();
  private sequenceBuilder = new AddressingSequenceBuilder();

  /**
   * Step 1: Plan the addressing (validate + map).
   */
  public planAddressing(devices: DaliDeviceDefinition[]): AddressingResult {
    return this.assignmentService.assign(devices);
  }

  /**
   * Step 2: Generate the physical commands to program those addresses.
   */
  public buildAddressingSequences(result: AddressingResult): DaliCommandSequence[] {
    if (!result.success) {
      throw new Error('Cannot build sequences: addressing plan has conflicts or unassigned devices.');
    }
    return this.sequenceBuilder.buildAll(result.mappings);
  }
}