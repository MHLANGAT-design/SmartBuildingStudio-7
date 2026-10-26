// src/modules/FloorPlanDesigner/Commands/AddRoomCommand.ts
//
// AddRoomCommand — command-pattern wrapper for the "create a room" action.
//
// IMPORTANT — RUNTIME NOTE:
//   RoomTool.onDoubleClick() commits the actual room via
//   store.dispatch(setDocument({ elements, rooms, walls })).
//   This command is invoked for compatibility with the command-manager
//   undo/redo stack, but its body is intentionally a no-op — the source
//   of truth is the Redux slice.
//
//   The prior implementation mutated `this.contextContainer.activeLayout`,
//   which is not a field on any live context object. That code was
//   silently a no-op at runtime; we make that intent explicit here.
//
//   The constructor retains the two extra parameters (roomData,
//   contextContainer) for call-site compatibility with RoomTool. They
//   are prefixed with `_` to mark them as intentionally unused.

import { ICommand } from '@/modules/FloorPlanDesigner/Commands/ICommand';

export class AddRoomCommand implements ICommand {
  private readonly id: string;
  private readonly roomId: string;
  private executed = false;

  constructor(
    roomId: string,
    _roomData: any,
    _contextContainer: any
  ) {
    this.id = `cmd_add_room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.roomId = roomId;
  }

  public getId(): string {
    return this.id;
  }

  public getDescription(): string {
    return `Add Room (${this.roomId})`;
  }

  public isExecuted(): boolean {
    return this.executed;
  }

  public execute(): void {
    if (this.executed) return;
    console.log(
      `[AddRoomCommand] Registering room boundary node: ${this.roomId}`
    );
    // The actual room insertion happens in RoomTool.onDoubleClick via
    // store.dispatch(setDocument(...)). This command exists so the
    // command-manager undo/redo stack has a token to reference; it does
    // not write state itself.
    this.executed = true;
  }

  public undo(): void {
    if (!this.executed) return;
    console.log(
      `[AddRoomCommand] Rolling back room boundary node: ${this.roomId}`
    );
    // No state to reverse here — the RoomTool's setDocument dispatch is
    // the authoritative insert. A future refactor can move the actual
    // room removal into this command when the undo stack is unified.
    this.executed = false;
  }

  public redo(): void {
    this.execute();
  }
}

export default AddRoomCommand;