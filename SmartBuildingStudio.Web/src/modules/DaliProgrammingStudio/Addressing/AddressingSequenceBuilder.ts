// src/modules/DaliProgrammingStudio/Addressing/AddressingSequenceBuilder.ts

import type { DaliCommandSequence, DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { AddressMapping } from '@/modules/DaliProgrammingStudio/Addressing/AddressMapping';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';

export class AddressingSequenceBuilder {
  /**
   * Builds a sequence for programming a short address via the random address.
   * In a real implementation, we would first set DTR0 to the random address, then send the program short address command.
   */
  public buildForDevice(mapping: AddressMapping): DaliCommandSequence {
    const commands: DaliCommand[] = [];

    // 1. Set DTR0 to the random address (for selecting the specific device)
    if (mapping.hardwareRandomAddress) {
      commands.push({
        id: `cmd_dtr0_${mapping.deviceId}`,
        category: DALI_COMMAND_CATEGORIES.ADDRESSING,
        targetAddress: 255, // Broadcast
        targetType: 'BROADCAST',
        opcode: DALI_OPCODES.SET_DTR0,
        data: parseInt(mapping.hardwareRandomAddress, 16) & 0xFF,
        description: `Set DTR0 to random address for ${mapping.deviceId}`,
      });
    }

    // 2. Program the short address
    commands.push({
      id: `cmd_prog_addr_${mapping.deviceId}`,
      category: DALI_COMMAND_CATEGORIES.ADDRESSING,
      targetAddress: mapping.shortAddress,
      targetType: 'SHORT_ADDRESS',
      opcode: DALI_OPCODES.PROGRAM_SHORT_ADDRESS,
      data: undefined,
      description: `Program short address ${mapping.shortAddress}`,
    });

    return {
      id: `seq_addr_${mapping.deviceId}`,
      targetDeviceId: mapping.deviceId,
      commands,
      dependencies: [],
    };
  }

  public buildAll(mappings: AddressMapping[]): DaliCommandSequence[] {
    return mappings.map(m => this.buildForDevice(m));
  }
}