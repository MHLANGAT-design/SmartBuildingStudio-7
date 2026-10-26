// src/modules/FloorPlanDesigner/Document/SelectionModel.ts

export class SelectionModel {
  private _selectedIds: Set<string> = new Set();

  get count(): number { return this._selectedIds.size; }
  get isEmpty(): boolean { return this._selectedIds.size === 0; }
  get selectedIds(): readonly string[] { return [...this._selectedIds]; }

  select(id: string): void {
    this._selectedIds.add(id);
  }

  deselect(id: string): void {
    this._selectedIds.delete(id);
  }

  toggle(id: string): void {
    if (this._selectedIds.has(id)) {
      this._selectedIds.delete(id);
    } else {
      this._selectedIds.add(id);
    }
  }

  clear(): void {
    this._selectedIds.clear();
  }

  isSelected(id: string): boolean {
    return this._selectedIds.has(id);
  }

  getFirst(): string | undefined {
    return this._selectedIds.values().next().value;
  }
}