// src/modules/DaliProgrammingStudio/hooks/useConfigurationBackup.ts

import { useCallback, useState } from 'react';
import type { ConfigurationBackup, BackupMetadata } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';
import type { RestorePreview } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationRestoreManager';
import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';
import { BackupService } from '@/modules/DaliProgrammingStudio/Services/BackupService';

export function useConfigurationBackup(service: BackupService) {
  const [backups, setBackups] = useState<ConfigurationBackup[]>([]);
  const [lastBackup, setLastBackup] = useState<ConfigurationBackup | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createBackup = useCallback((
    metadata: BackupMetadata,
    configurations: ExpectedDeviceConfiguration[]
  ) => {
    try {
      const backup = service.createBackup(metadata, configurations);
      setLastBackup(backup);
      setBackups(prev => [backup, ...prev]);
      return backup;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, [service]);

  const previewRestoreAction = useCallback((
    backup: ConfigurationBackup,
    current: ExpectedDeviceConfiguration[],
    targetGatewayId: string
  ) => {
    try {
      const preview = service.previewRestore(backup, current, targetGatewayId);
      setRestorePreview(preview);
      return preview;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, [service]);

  const exportBackup = useCallback((backupId: string) => {
    return service.exportBackup(backupId);
  }, [service]);

  const importBackup = useCallback((jsonString: string) => {
    try {
      const backup = service.importBackup(jsonString);
      setLastBackup(backup);
      setBackups(prev => [backup, ...prev]);
      return backup;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, [service]);

  return {
    backups,
    lastBackup,
    restorePreview,
    error,
    createBackup,
    previewRestore: previewRestoreAction,
    exportBackup,
    importBackup,
    hasBackups: backups.length > 0,
  };
}