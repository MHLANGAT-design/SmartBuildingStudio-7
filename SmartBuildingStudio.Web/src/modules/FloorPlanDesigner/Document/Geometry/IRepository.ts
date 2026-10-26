// src/modules/FloorPlanDesigner/Document/Geometry/IRepository.ts

export interface IRepository<TEntity> {
  // Properties
  get count(): number;
  get isEmpty(): boolean;
  
  // Queries
  contains(id: string): boolean;
  get(id: string): TEntity | undefined;
  getAll(): readonly TEntity[];
  
  // Commands
  add(entity: TEntity): void;
  update(entity: TEntity): void;
  remove(id: string): boolean;
  clear(): void;
}