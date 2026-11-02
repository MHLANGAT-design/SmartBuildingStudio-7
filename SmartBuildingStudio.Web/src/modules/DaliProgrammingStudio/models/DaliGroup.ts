// src/modules/DaliProgrammingStudio/models/DaliGroup.ts

import type { DaliGroupDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

export class DaliGroup {
  constructor(private readonly data: DaliGroupDefinition) {}

  get id(): number { return this.data.groupId; }
  get name(): string { return this.data.name; }
  get lineId(): string { return this.data.lineId; }
}