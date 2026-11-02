// src/modules/DaliProgrammingStudio/models/DaliScene.ts

import type { DaliSceneDefinition } from '@/modules/DaliProgrammingStudio/types/device.types';

export class DaliScene {
  constructor(private readonly data: DaliSceneDefinition) {}

  get id(): number { return this.data.sceneId; }
  get name(): string { return this.data.name; }
  get lineId(): string { return this.data.lineId; }
}