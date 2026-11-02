// src/modules/DaliProgrammingStudio/Diagnostics/DeviceCommunicationTester.ts

import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import type { IGatewayAdapter } from '@/modules/DaliProgrammingStudio/types/gateway.types';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';
import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { withTimeout } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandTimeout';
import { DALI_PROGRAMMING_LIMITS } from '@/modules/DaliProgrammingStudio/constants/daliLimits';

export class DeviceCommunicationTester {
  constructor(private gateway: IGatewayAdapter) {}

  public async testCommunication(shortAddress: number): Promise<boolean> {
    // Send a standard Query Short Address command
    const command = DaliCommandFactory.createCommand(
      DALI_COMMAND_CATEGORIES.QUERY,
      'SHORT_ADDRESS',
      shortAddress,
      DALI_OPCODES.QUERY_SHORT_ADDRESS,
      0,
      'Query short address'
    );

    try {
      const response = await withTimeout(
        this.gateway.sendCommand(command),
        DALI_PROGRAMMING_LIMITS.COMMAND_TIMEOUT_MS
      );
      return response.success;
    } catch {
      return false;
    }
  }
}