// src/modules/DaliProgrammingStudio/Backup/ConfigurationDiff.ts

import type { ExpectedDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';

export interface DeviceDifference {
  deviceId: string;
  field: string;
  backupValue: unknown;
  currentValue: unknown;
}

export interface ConfigurationDiff {
  totalDevicesCompared: number;
  devicesWithDifferences: number;
  differences: DeviceDifference[];
}

export class ConfigurationDiffEngine {
  public compare(
    backup: ExpectedDeviceConfiguration[],
    current: ExpectedDeviceConfiguration[]
  ): ConfigurationDiff {
    const differences: DeviceDifference[] = [];
    const currentMap = new Map(current.map(c => [c.deviceId, c]));
    const devicesWithDifferences = new Set<string>();

    for (const backupDevice of backup) {
      const currentDevice = currentMap.get(backupDevice.deviceId);
      
      if (!currentDevice) {
        differences.push({
          deviceId: backupDevice.deviceId,
          field: 'device',
          backupValue: 'Present',
          currentValue: 'Missing',
        });
        devicesWithDifferences.add(backupDevice.deviceId);
        continue;
      }

      // Check address
      if (backupDevice.shortAddress !== currentDevice.shortAddress) {
        differences.push({
          deviceId: backupDevice.deviceId,
          field: 'shortAddress',
          backupValue: backupDevice.shortAddress,
          currentValue: currentDevice.shortAddress,
        });
        devicesWithDifferences.add(backupDevice.deviceId);
      }

      // Check parameters
      const keys = Object.keys(backupDevice.parameters) as Array<keyof typeof backupDevice.parameters>;
      for (const key of keys) {
        if (backupDevice.parameters[key] !== currentDevice.parameters[key]) {
          differences.push({
            deviceId: backupDevice.deviceId,
            field: `param.${String(key)}`,
            backupValue: backupDevice.parameters[key],
            currentValue: currentDevice.parameters[key],
          });
          devicesWithDifferences.add(backupDevice.deviceId);
        }
      }
    }

    return {
      totalDevicesCompared: backup.length,
      devicesWithDifferences: devicesWithDifferences.size,
      differences,
    };
  }
}