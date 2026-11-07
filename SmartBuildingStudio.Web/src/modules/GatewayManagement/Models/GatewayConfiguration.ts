// src/modules/GatewayManagement/Models/GatewayConfiguration.ts

/**
 * Editable gateway configuration. The backend stores this nested inside
 * Gateway itself; this model is what the registration form and the
 * configuration edit dialog work with.
 */

export interface GatewayConfiguration {
  daliLineCount: number;
  pollingIntervalSeconds: number;
  commandTimeoutSeconds: number;
  authToken: string | null;
}

export const DEFAULT_GATEWAY_CONFIGURATION: GatewayConfiguration = {
  daliLineCount: 1,
  pollingIntervalSeconds: 15,
  commandTimeoutSeconds: 30,
  authToken: null,
};

export const createEmptyGatewayConfiguration = (
  partial?: Partial<GatewayConfiguration>
): GatewayConfiguration => ({
  daliLineCount: partial?.daliLineCount ?? DEFAULT_GATEWAY_CONFIGURATION.daliLineCount,
  pollingIntervalSeconds:
    partial?.pollingIntervalSeconds ?? DEFAULT_GATEWAY_CONFIGURATION.pollingIntervalSeconds,
  commandTimeoutSeconds:
    partial?.commandTimeoutSeconds ?? DEFAULT_GATEWAY_CONFIGURATION.commandTimeoutSeconds,
  authToken: partial?.authToken ?? null,
});

export interface GatewayConfigurationValidation {
  valid: boolean;
  errors: Record<string, string>;
}

export const validateGatewayConfiguration = (
  config: GatewayConfiguration
): GatewayConfigurationValidation => {
  const errors: Record<string, string> = {};
  if (config.daliLineCount < 1 || config.daliLineCount > 64) {
    errors.daliLineCount = 'DALI line count must be between 1 and 64.';
  }
  if (config.pollingIntervalSeconds < 1) {
    errors.pollingIntervalSeconds = 'Polling interval must be positive.';
  }
  if (config.commandTimeoutSeconds < 1) {
    errors.commandTimeoutSeconds = 'Command timeout must be positive.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
};