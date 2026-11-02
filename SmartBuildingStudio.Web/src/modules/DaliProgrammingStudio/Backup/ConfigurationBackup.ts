// src/modules/DaliProgrammingStudio/Backup/ConfigurationBackup.ts

import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';

export interface BackupMetadata {
  projectId: string;
  designRevisionId: string;
  gatewayId: string;
  lineId: string;
  createdBy: string;
  deviceCount: number;
}

export interface ConfigurationBackup {
  backupId: string;
  version: string; // e.g., "1.0"
  timestamp: string;
  metadata: BackupMetadata;
  deviceConfigurations: ExpectedDeviceConfiguration[];
  checksum: string; // Hash for integrity verification
}