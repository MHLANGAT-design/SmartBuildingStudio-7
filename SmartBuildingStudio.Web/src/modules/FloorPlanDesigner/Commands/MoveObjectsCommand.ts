import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export interface MoveDelta {
    id: string;

    /**
     * Original position
     */
    from: { x: number; y: number };

    /**
     * New position
     */
    to: { x: number; y: number };
}

export interface MoveObjectsCommandOptions {
    document: DrawingDocument;
    deltas: MoveDelta[];
}

export class MoveObjectsCommand implements ICommand {
    private readonly id: string;
    private readonly document: DrawingDocument;
    private readonly deltas: MoveDelta[];
    private executed = false;

    constructor(options: MoveObjectsCommandOptions) {
        this.id = `cmd_${Date.now()}_${Math.random()}`;
        this.document = options.document;
        this.deltas = options.deltas;
    }

    // --------------------------------------------------------
    // Identity
    // --------------------------------------------------------

    public getId(): string {
        return this.id;
    }

    public getDescription(): string {
        return "Move Objects";
    }

    public isExecuted(): boolean {
        return this.executed;
    }

    // --------------------------------------------------------
    // Execution
    // --------------------------------------------------------

    public execute(): void {
        if (this.executed) return;

        for (const delta of this.deltas) {
            // Note: If findObject isn't on DrawingDocument yet, it cast down or updated there.
            const object = (this.document as any).findObject?.(delta.id);
            if (!object) continue;

            object.setPosition(delta.to);
        }

        this.executed = true;
    }

    // --------------------------------------------------------
    // Undo / Redo
    // --------------------------------------------------------

    public undo(): void {
        if (!this.executed) return;

        for (const delta of this.deltas) {
            const object = (this.document as any).findObject?.(delta.id);
            if (!object) continue;

            object.setPosition(delta.from);
        }

        this.executed = false;
    }

    public redo(): void {
        this.execute();
    }
}
