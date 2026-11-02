// src/modules/DaliProgrammingStudio/Services/BackupService.ts

import type { ConfigurationBackup, BackupMetadata } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';
import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';
import type { RestorePreview } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationRestoreManager';
import { ConfigurationBackupManager } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackupManager';
import { ConfigurationRestoreManager } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationRestoreManager';

export class BackupService {
  private backupManager = new ConfigurationBackupManager();
  private restoreManager = new ConfigurationRestoreManager();

  public createBackup(metadata: BackupMetadata, configs: ExpectedDeviceConfiguration[]): ConfigurationBackup {
    return this.backupManager.createBackup(metadata, configs);
  }

  public exportBackup(backupId: string): string | null {
    return this.backupManager.exportBackup(backupId);
  }

  public importBackup(jsonString: string): ConfigurationBackup {
    return this.backupManager.importBackup(jsonString);
  }

  public previewRestore(
    backup: ConfigurationBackup,
    current: ExpectedDeviceConfiguration[],
    targetGatewayId: string
  ): RestorePreview {
    return this.restoreManager.previewRestore(backup, current, targetGatewayId);
  }
}