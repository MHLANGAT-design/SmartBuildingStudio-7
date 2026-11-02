// src/modules/DaliProgrammingStudio/types/command.types.ts

import type { DaliCommandCategory, DaliCommandStatus } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';
import type { DeviceConfigurationParameters } from '@/modules/DaliProgrammingStudio/types/device.types';

/**
 * A single atomic operation to be sent to the DALI bus.
 */
export interface DaliCommand {
  id: string;
  category: DaliCommandCategory;
  targetAddress: number; // Short address (0-63), group address, or broadcast
  targetType: 'SHORT_ADDRESS' | 'GROUP' | 'BROADCAST';
  opcode: number;
  data?: number;
  description: string;
}

/**
 * A set of commands that must be executed together or in sequence for a specific device or group.
 */
export interface DaliCommandSequence {
  id: string;
  targetDeviceId?: string;
  targetGroupId?: number;
  commands: DaliCommand[];
  dependencies: string[]; // IDs of sequences that must complete first
}

/**
 * The result of executing a command sequence.
 */
export interface CommandExecutionResult {
  sequenceId: string;
  status: DaliCommandStatus;
  errorMessage?: string;
  timestamp: string;
  durationMs: number;
}

/**
 * A verification check comparing expected vs actual.
 */
export interface VerificationCheck {
  parameter: keyof DeviceConfigurationParameters | 'groups' | 'scenes' | 'address';
  expectedValue: any;
  actualValue: any;
  isMatch: boolean;
}