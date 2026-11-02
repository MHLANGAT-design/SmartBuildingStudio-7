// src/modules/DaliProgrammingStudio/models/DaliLine.ts

import type { DaliLine } from '@/modules/DaliProgrammingStudio/types/dali.types';

export class DaliLineModel {
  constructor(private readonly data: DaliLine) {}

  get id(): string { return this.data.lineId; }
  get name(): string { return this.data.name; }
  get gatewayId(): string { return this.data.gatewayId; }
  
  public isFull(): boolean {
    return this.data.deviceCount >= this.data.maxDevices;
  }

  public getRemainingCapacity(): number {
    return Math.max(0, this.data.maxDevices - this.data.deviceCount);
  }
}