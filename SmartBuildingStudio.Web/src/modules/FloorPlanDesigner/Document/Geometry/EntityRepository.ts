// src/modules/FloorPlanDesigner/Document/Geometry/EntityRepository.ts

import { IRepository } from "@/modules/FloorPlanDesigner/Document/Geometry/IRepository";

export abstract class EntityRepository<TEntity> implements IRepository<TEntity> {
  protected readonly entities = new Map<string, TEntity>();
  
  constructor(protected readonly events?: any) {}
  
  // Properties
  get count(): number { return this.entities.size; }
  get isEmpty(): boolean { return this.entities.size === 0; }
  
  // Queries
  contains(id: string): boolean { return this.entities.has(id); }
  get(id: string): TEntity | undefined { return this.entities.get(id); }
  getAll(): readonly TEntity[] { return [...this.entities.values()]; }
  
  // Commands
  add(entity: TEntity): void {
    const id = this.getEntityId(entity);
    if (this.entities.has(id)) {
      throw new Error(`[${this.getEntityType()}] Entity '${id}' already exists.`);
    }
    this.entities.set(id, entity);
    this.onAdded(entity);
  }
  
  update(entity: TEntity): void {
    const id = this.getEntityId(entity);
    if (!this.entities.has(id)) {
      throw new Error(`[${this.getEntityType()}] Entity '${id}' does not exist.`);
    }
    this.entities.set(id, entity);
    this.onUpdated(entity);
  }
  
  remove(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;
    this.entities.delete(id);
    this.onRemoved(entity);
    return true;
  }
  
  clear(): void {
    if (this.entities.size === 0) return;
    this.entities.clear();
    this.onCleared();
  }
  
  // Abstract methods for subclasses
  protected abstract getEntityType(): string;
  protected abstract getEntityId(entity: TEntity): string;
  protected abstract onAdded(entity: TEntity): void;
  protected abstract onUpdated(entity: TEntity): void;
  protected abstract onRemoved(entity: TEntity): void;
  protected onCleared(): void {}
}