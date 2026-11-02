// src/modules/DaliProgrammingStudio/Deployment/DeploymentQueue.ts

import type { DaliCommandSequence } from '@/modules/DaliProgrammingStudio/types/command.types';

export class DeploymentQueue {
  private queue: DaliCommandSequence[] = [];
  private skipped: Set<string> = new Set();
  private completed: Set<string> = new Set();

  constructor(sequences: DaliCommandSequence[]) {
    this.queue = [...sequences];
  }

  public next(): DaliCommandSequence | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() || null;
  }

  public peek(): DaliCommandSequence | null {
    return this.queue[0] || null;
  }

  public markCompleted(sequenceId: string): void {
    this.completed.add(sequenceId);
  }

  public markSkipped(sequenceId: string): void {
    this.skipped.add(sequenceId);
  }

  public isCompleted(sequenceId: string): boolean {
    return this.completed.has(sequenceId);
  }

  public isSkipped(sequenceId: string): boolean {
    return this.skipped.has(sequenceId);
  }

  public hasRemaining(): boolean {
    return this.queue.length > 0;
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public getSkippedIds(): string[] {
    return Array.from(this.skipped);
  }

  public getCompletedIds(): string[] {
    return Array.from(this.completed);
  }
}