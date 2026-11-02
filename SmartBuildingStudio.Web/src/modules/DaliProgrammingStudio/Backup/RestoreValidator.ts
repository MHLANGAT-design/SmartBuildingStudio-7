// src/modules/DaliProgrammingStudio/Backup/RestoreValidator.ts

import type { ConfigurationBackup } from '@/modules/DaliProgrammingStudio/Backup/ConfigurationBackup';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class RestoreValidator {
  public validate(backup: ConfigurationBackup, targetGatewayId: string): ValidationResult {
    const errors: string[] = [];

    if (!backup.deviceConfigurations || backup.deviceConfigurations.length === 0) {
      errors.push('Backup contains no device configurations.');
    }

    if (backup.metadata.gatewayId !== targetGatewayId) {
      errors.push(
        `Backup was created for gateway ${backup.metadata.gatewayId}, but target is ${targetGatewayId}. Restoring across gateways requires explicit override.`
      );
    }

    // Integrity check
    if (!backup.checksum) {
      errors.push('Backup file is missing checksum. Integrity cannot be verified.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}