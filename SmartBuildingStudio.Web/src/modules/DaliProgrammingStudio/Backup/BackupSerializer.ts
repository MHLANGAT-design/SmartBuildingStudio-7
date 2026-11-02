// src/modules/DaliProgrammingStudio/Backup/BackupSerializer.ts

import type { ConfigurationBackup } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';

export class BackupSerializer {
  public static serialize(backup: ConfigurationBackup): string {
    return JSON.stringify(backup, null, 2);
  }

  public static deserialize(jsonString: string): ConfigurationBackup {
    try {
      const parsed = JSON.parse(jsonString);
      // In production, we should validate the parsed object against a schema here
      if (!parsed.backupId || !parsed.deviceConfigurations) {
        throw new Error('Invalid backup format.');
      }
      return parsed as ConfigurationBackup;
    } catch (e: any) {
      throw new Error(`Failed to deserialize backup: ${e.message}`);
    }
  }
}