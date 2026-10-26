// src/modules/FloorPlanDesigner/Commands/DeleteSelectedElementsCommand.ts
import { ICommand } from "./ICommand";
import { DrawingDocument } from "../Document/DrawingDocument";
import { DeleteWallsCommand } from "./DeleteWallsCommand";
import { DeleteDoorsCommand } from "./DeleteDoorsCommand";
import { DeleteWindowsCommand } from "./DeleteWindowsCommand";

export interface DeleteSelectedElementsCommandOptions {
  document: DrawingDocument;
  selectedElement: { id: string; type: string; Id?: string };
}

export class DeleteSelectedElementsCommand implements ICommand {
  private readonly id: string;
  private readonly document: DrawingDocument;
  private readonly selectedElement: any;
  private subCommand: ICommand | null = null;
  private executed = false;

  constructor(options: DeleteSelectedElementsCommandOptions) {
    this.id = `cmd_delete_sel_${Date.now()}_${Math.random()}`;
    this.document = options.document;
    this.selectedElement = options.selectedElement;

    const elementId = String(this.selectedElement.id || this.selectedElement.Id);
    const type = String(this.selectedElement.type || '').toLowerCase();

    console.log(`🗑️ DeleteSelectedElementsCommand: type=${type}, id=${elementId}`);

    if (type === 'wall' || type === 'walls') {
      this.subCommand = new DeleteWallsCommand({ document: this.document, wallIds: [elementId] });
    } else if (type === 'door' || type === 'doors') {
      this.subCommand = new DeleteDoorsCommand({ document: this.document, doorIds: [elementId] });
    } else if (type === 'window' || type === 'windows') {
      this.subCommand = new DeleteWindowsCommand({ document: this.document, windowIds: [elementId] });
    } else {
      // Fallback: try to determine type from element structure
      console.warn(`⚠️ Unknown element type: ${type}, trying to determine...`);
      if (this.selectedElement.startX !== undefined && this.selectedElement.endX !== undefined) {
        this.subCommand = new DeleteWallsCommand({ document: this.document, wallIds: [elementId] });
      } else if (this.selectedElement.swingQuadrant) {
        this.subCommand = new DeleteDoorsCommand({ document: this.document, doorIds: [elementId] });
      } else {
        this.subCommand = new DeleteWindowsCommand({ document: this.document, windowIds: [elementId] });
      }
    }
  }

  public getId(): string { return this.id; }
  public getDescription(): string { return `Delete Selected ${this.selectedElement?.type || 'Element'}`; }
  public isExecuted(): boolean { return this.executed; }

  public execute(): void {
    if (this.executed || !this.subCommand) {
      console.warn('⚠️ DeleteSelectedElementsCommand: Already executed or no subcommand');
      return;
    }
    
    console.log('🗑️ DeleteSelectedElementsCommand: Executing...');
    this.subCommand.execute();
    this.executed = true;
    console.log('✅ DeleteSelectedElementsCommand: Executed successfully');
  }

  public undo(): void {
    if (!this.executed || !this.subCommand) return;
    console.log('↩️ DeleteSelectedElementsCommand: Undoing...');
    this.subCommand.undo();
    this.executed = false;
    console.log('✅ DeleteSelectedElementsCommand: Undone successfully');
  }

  public redo(): void {
    if (!this.subCommand) return;
    console.log('🔁 DeleteSelectedElementsCommand: Redoing...');
    this.subCommand.redo();
    this.executed = true;
    console.log('✅ DeleteSelectedElementsCommand: Redone successfully');
  }
}
export default DeleteSelectedElementsCommand;