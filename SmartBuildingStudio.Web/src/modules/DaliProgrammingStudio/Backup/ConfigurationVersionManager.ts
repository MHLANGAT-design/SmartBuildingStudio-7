// src/modules/DaliProgrammingStudio/Backup/ConfigurationVersionManager.ts

import type { ConfigurationBackup } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';

export class ConfigurationVersionManager {
  private backups: ConfigurationBackup[] = [];

  public addBackup(backup: ConfigurationBackup): void {
    this.backups.push(backup);
    // Sort by timestamp (newest first)
    this.backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getBackup(backupId: string): ConfigurationBackup | undefined {
    return this.backups.find(b => b.backupId === backupId);
  }

  public getAllBackups(): ConfigurationBackup[] {
    return [...this.backups];
  }

  public getLatestBackup(): ConfigurationBackup | undefined {
    return this.backups[0];
  }

  public getBackupsForProject(projectId: string): ConfigurationBackup[] {
    return this.backups.filter(b => b.metadata.projectId === projectId);
  }
}