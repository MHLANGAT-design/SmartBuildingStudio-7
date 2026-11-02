// src/modules/DaliProgrammingStudio/Configuration/SceneConfigurationManager.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { DaliCommandFactory } from '@/modules/DaliProgrammingStudio/Commands/DaliCommandFactory';
import { DALI_COMMAND_CATEGORIES, DALI_OPCODES } from '@/modules/DaliProgrammingStudio/constants/daliCommandConstants';
import { DeviceCapabilityProfile } from '@/modules/DaliProgrammingStudio/models/DeviceCapabilityProfile';

export class SceneConfigurationManager {
  public buildCommands(device: DaliDeviceDefinition): DaliCommand[] {
    const commands: DaliCommand[] = [];
    const capabilities = new DeviceCapabilityProfile(device);

    if (!capabilities.canConfigureScenes()) {
      return commands;
    }

    for (const scene of device.scenes) {
      // Step 1: Set the level (direct arc power control)
      commands.push(DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.SCENE,
        'SHORT_ADDRESS',
        device.hardwareAddress,
        0xFE, // Direct Arc Power Control
        scene.level,
        `Set dim level to ${scene.level} before storing scene ${scene.sceneId}`
      ));

      // Step 2: Store the level into the scene
      commands.push(DaliCommandFactory.createCommand(
        DALI_COMMAND_CATEGORIES.SCENE,
        'SHORT_ADDRESS',
        device.hardwareAddress,
        DALI_OPCODES.STORE_SCENE + scene.sceneId,
        0,
        `Store scene ${scene.sceneId}`
      ));
    }

    return commands;
  }
}