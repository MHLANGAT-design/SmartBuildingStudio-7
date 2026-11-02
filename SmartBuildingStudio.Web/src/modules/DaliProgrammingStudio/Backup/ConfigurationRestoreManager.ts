// src/modules/DaliProgrammingStudio/Backup/ConfigurationRestoreManager.ts

import type { ConfigurationBackup } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';
import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';
import { RestoreValidator } from '@/modules/DaliProgrammingStudio/Backup/RestoreValidator';
import { ConfigurationDiffEngine, type ConfigurationDiff } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationDiff';

export interface RestorePreview {
  isValid: boolean;
  errors: string[];
  diff: ConfigurationDiff | null;
}

export class ConfigurationRestoreManager {
  private validator = new RestoreValidator();
  private diffEngine = new ConfigurationDiffEngine();

  /**
   * Step 1: Generate a preview of the restore so the engineer can confirm.
   */
  public previewRestore(
    backup: ConfigurationBackup,
    currentConfiguration: ExpectedDeviceConfiguration[],
    targetGatewayId: string
  ): RestorePreview {
    const validation = this.validator.validate(backup, targetGatewayId);
    
    if (!validation.isValid) {
      return { isValid: false, errors: validation.errors, diff: null };
    }

    const diff = this.diffEngine.compare(backup.deviceConfigurations, currentConfiguration);

    return {
      isValid: true,
      errors: [],
      diff,
    };
  }

  /**
   * Step 2: After explicit user confirmation, generate the data needed to restore.
   * Note: The actual execution would flow through the Compiler -> Deployment pipeline.
   */
  public applyRestore(backup: ConfigurationBackup): ExpectedDeviceConfiguration[] {
    // Safety Rule #11: Return a copy so we don't mutate the original backup
    return backup.deviceConfigurations.map(device => ({
      ...device,
      parameters: { ...device.parameters },
      groups: [...device.groups],
      scenes: [...device.scenes],
    }));
  }
}