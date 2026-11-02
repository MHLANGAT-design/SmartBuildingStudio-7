// src/modules/DaliProgrammingStudio/Compiler/CommandSequenceBuilder.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand, DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';
import { randomUUID } from 'crypto'; // If not available in browser, use a simple uuid helper

export class CommandSequenceBuilder {
  
  /**
   * Builds the sequence of commands required to program a single device.
   * Sequence 1: Addressing (if needed)
   * Sequence 2: Device Parameters (Min/Max levels)
   * Sequence 3: Groups
   * Sequence 4: Scenes
   */
  public buildForDevice(device: DaliDeviceDefinition): DaliCommandSequence[] {
    const sequences: DaliCommandSequence[] = [];
    const deviceId = device.deviceId;

    // 1. Addressing Sequence (Placeholder - handled more fully in AddressingResolver later)
    // For now, we assume the address is already set in design.

    // 2. Parameter Sequence
    if (device.parameters) {
      const paramCommands: DaliCommand[] = [];
      const addr = device.hardwareAddress;

      if (device.parameters.minLevel !== undefined) {
        paramCommands.push(this.createCommand(addr, DALI_OPCODES.WRITE_MEMORY_LOCATION, device.parameters.minLevel, 'Set Min Level'));
      }
      if (device.parameters.maxLevel !== undefined) {
        paramCommands.push(this.createCommand(addr, DALI_OPCODES.WRITE_MEMORY_LOCATION, device.parameters.maxLevel, 'Set Max Level'));
      }
      if (device.parameters.powerOnLevel !== undefined) {
        paramCommands.push(this.createCommand(addr, DALI_OPCODES.WRITE_MEMORY_LOCATION, device.parameters.powerOnLevel, 'Set Power On Level'));
      }
      if (device.parameters.systemFailureLevel !== undefined) {
        paramCommands.push(this.createCommand(addr, DALI_OPCODES.WRITE_MEMORY_LOCATION, device.parameters.systemFailureLevel, 'Set System Failure Level'));
      }

      if (paramCommands.length > 0) {
        sequences.push({
          id: `seq_param_${deviceId}`,
          targetDeviceId: deviceId,
          commands: paramCommands,
          dependencies: [],
        });
      }
    }

    // 3. Group Sequence
    if (device.groups && device.groups.length > 0) {
      const groupCommands: DaliCommand[] = [];
      const addr = device.hardwareAddress;

      for (const group of device.groups) {
        // DALI Group addressing uses opcodes 0x40-0x4F
        groupCommands.push(this.createCommand(addr, DALI_OPCODES.ADD_TO_GROUP + group.groupId, 0, `Add to Group ${group.groupId}`));
      }

      sequences.push({
        id: `seq_group_${deviceId}`,
        targetDeviceId: deviceId,
        commands: groupCommands,
        // Group assignment should happen AFTER addressing, but before scenes
        dependencies: [`seq_param_${deviceId}`], 
      });
    }

    // 4. Scene Sequence
    if (device.scenes && device.scenes.length > 0) {
      const sceneCommands: DaliCommand[] = [];
      const addr = device.hardwareAddress;

      for (const scene of device.scenes) {
        // DALI Scene addressing uses opcodes 0x10-0x1F
        sceneCommands.push(this.createCommand(addr, DALI_OPCODES.RECALL_SCENE + scene.sceneId, scene.level, `Set Scene ${scene.sceneId} to ${scene.level}`));
      }

      sequences.push({
        id: `seq_scene_${deviceId}`,
        targetDeviceId: deviceId,
        commands: sceneCommands,
        dependencies: [`seq_group_${deviceId}`],
      });
    }

    return sequences;
  }

  private createCommand(targetAddress: number, opcode: number, data: number, description: string): DaliCommand {
    return {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: DALI_COMMAND_CATEGORIES.CONFIGURATION,
      targetAddress,
      targetType: 'SHORT_ADDRESS',
      opcode,
      data,
      description,
    };
  }
}