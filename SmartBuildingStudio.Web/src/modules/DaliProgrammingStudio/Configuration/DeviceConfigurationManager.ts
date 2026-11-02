// src/modules/DaliProgrammingStudio/Configuration/DeviceConfigurationManager.ts

import type { DaliDeviceDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';
import type { DaliCommandSequence, DaliCommand } from '@/modules/DaliProgrammingStudio/types/command.types';
import { ControlGearConfigurator } from '@/modules/DaliProgrammingStudio/Configuration/ControlGearConfigurator';
import { ControlDeviceConfigurator } from '@/modules/DaliProgrammingStudio/Configuration/ControlDeviceConfigurator';
import { GroupConfigurationManager } from '@/modules/DaliProgrammingStudio/Configuration/GroupConfigurationManager';
import { SceneConfigurationManager } from '@/modules/DaliProgrammingStudio/Configuration/SceneConfigurationManager';
import { DaliDevice } from '@/modules/DaliProgrammingStudio/models/DaliDevice';

export class DeviceConfigurationManager {
  private controlGearConfigurator = new ControlGearConfigurator();
  private controlDeviceConfigurator = new ControlDeviceConfigurator();
  private groupManager = new GroupConfigurationManager();
  private sceneManager = new SceneConfigurationManager();

  public buildSequencesForAll(devices: DaliDeviceDefinition[]): DaliCommandSequence[] {
    return devices.flatMap(device => this.buildSequences(device));
  }

  public buildSequences(device: DaliDeviceDefinition): DaliCommandSequence[] {
    const deviceModel = new DaliDevice(device);
    const sequences: DaliCommandSequence[] = [];

    let paramCommands: DaliCommand[] = [];
    if (deviceModel.isControlGear()) {
      paramCommands = this.controlGearConfigurator.buildCommands(device);
    } else if (deviceModel.isControlDevice()) {
      paramCommands = this.controlDeviceConfigurator.buildCommands(device);
    }

    if (paramCommands.length > 0) {
      sequences.push({
        id: `seq_config_${device.deviceId}`,
        targetDeviceId: device.deviceId,
        commands: paramCommands,
        dependencies: [],
      });
    }

    const groupCommands = this.groupManager.buildCommands(device);
    if (groupCommands.length > 0) {
      sequences.push({
        id: `seq_groups_${device.deviceId}`,
        targetDeviceId: device.deviceId,
        commands: groupCommands,
        dependencies: paramCommands.length > 0 ? [`seq_config_${device.deviceId}`] : [],
      });
    }

    const sceneCommands = this.sceneManager.buildCommands(device);
    if (sceneCommands.length > 0) {
      sequences.push({
        id: `seq_scenes_${device.deviceId}`,
        targetDeviceId: device.deviceId,
        commands: sceneCommands,
        dependencies: groupCommands.length > 0 ? [`seq_groups_${device.deviceId}`] : [],
      });
    }

    return sequences;
  }
}