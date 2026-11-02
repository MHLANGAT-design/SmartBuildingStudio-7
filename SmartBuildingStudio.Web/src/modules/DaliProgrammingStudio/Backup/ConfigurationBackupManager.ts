// src/modules/DaliProgrammingStudio/Backup/ConfigurationBackupManager.ts

import type { ConfigurationBackup, BackupMetadata } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';
import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';
import { ConfigurationVersionManager } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationVersionManager';
import { BackupSerializer } from '@/modules/DaliProgrammingStudio/Backup/BackupSerializer';

export class ConfigurationBackupManager {
  private versionManager = new ConfigurationVersionManager();

  public createBackup(metadata: BackupMetadata, configurations: ExpectedDeviceConfiguration[]): ConfigurationBackup {
    const backup: ConfigurationBackup = {
      backupId: `bkp_${Date.now()}`,
      version: '1.0',
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        deviceCount: configurations.length,
      },
      deviceConfigurations: configurations,
      checksum: this.generateChecksum(configurations),
    };

    this.versionManager.addBackup(backup);
    return backup;
  }

  public exportBackup(backupId: string): string | null {
    const backup = this.versionManager.getBackup(backupId);
    if (!backup) return null;
    return BackupSerializer.serialize(backup);
  }

  public importBackup(jsonString: string): ConfigurationBackup {
    const backup = BackupSerializer.deserialize(jsonString);
    this.versionManager.addBackup(backup);
    return backup;
  }

  public getBackupHistory(projectId: string): ConfigurationBackup[] {
    return this.versionManager.getBackupsForProject(projectId);
  }

  private generateChecksum(configurations: ExpectedDeviceConfiguration[]): string {
    // Simple checksum for demo purposes. In production, use a proper hash (e.g., SHA-256)
    const str = JSON.stringify(configurations);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }
}