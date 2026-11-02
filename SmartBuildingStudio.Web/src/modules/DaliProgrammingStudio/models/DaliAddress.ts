// src/modules/DaliProgrammingStudio/models/DaliAddress.ts

export class DaliAddress {
  constructor(public readonly value: number) {
    if (value < 0 || value > 63) {
      throw new Error(`Invalid DALI short address: ${value}. Must be between 0 and 63.`);
    }
  }

  public isBroadcast(): boolean {
    return this.value === 255;
  }

  public toString(): string {
    return this.value.toString().padStart(2, '0');
  }
}