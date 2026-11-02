// src/modules/DaliProgrammingStudio/models/ConfigurationState.ts

import type { ExpectedDeviceConfiguration, ActualDeviceConfiguration } from '@/modules/DaliProgrammingStudio/types/configuration.types';

export class ConfigurationState {
  constructor(
    public readonly expected: ExpectedDeviceConfiguration,
    public readonly actual: ActualDeviceConfiguration | null = null
  ) {}

  public hasBeenReadBack(): boolean {
    return this.actual !== null;
  }

  public getDifferences(): string[] {
    if (!this.actual) return ['Configuration not read back yet.'];
    
    const diffs: string[] = [];
    
    if (this.expected.shortAddress !== this.actual.shortAddress) {
      diffs.push(`Address mismatch: expected ${this.expected.shortAddress}, got ${this.actual.shortAddress}`);
    }
    
    // Check parameters (simplified example)
    const expParams = this.expected.parameters;
    const actParams = this.actual.parameters;
    if (expParams.minLevel !== actParams.minLevel) {
      diffs.push(`MinLevel mismatch: expected ${expParams.minLevel}, got ${actParams.minLevel}`);
    }

    return diffs;
  }
}