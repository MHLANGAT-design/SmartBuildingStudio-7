import { ICommand } from "@/modules/FloorPlanDesigner/Commands/ICommand";
import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";

export interface WallResizeState {
    wallId: string;

    /**
     * Original wall endpoints
     */
    from: {
        start: { x: number; y: number };
        end: { x: number; y: number };
    };

    /**
     * New wall endpoints
     */
    to: {
        start: { x: number; y: number };
        end: { x: number; y: number };
    };
}

export interface ResizeWallCommandOptions {
    document: DrawingDocument;
    resizeStates: WallResizeState[];
}

export class ResizeWallCommand implements ICommand {
    private readonly id: string;
    private readonly document: DrawingDocument;
    private readonly resizeStates: WallResizeState[];
    private executed = false;

    constructor(options: ResizeWallCommandOptions) {
        this.id = `cmd_${Date.now()}_${Math.random()}`;
        this.document = options.document;
        this.resizeStates = options.resizeStates;
    }

    // --------------------------------------------------------
    // Identity
    // --------------------------------------------------------

    public getId(): string {
        return this.id;
    }

    public getDescription(): string {
        return "Resize Wall";
    }

    public isExecuted(): boolean {
        return this.executed;
    }

    // --------------------------------------------------------
    // Execution
    // --------------------------------------------------------

    public execute(): void {
        if (this.executed) return;

        for (const state of this.resizeStates) {
            const wall = this.document.findWall(state.wallId);
            if (!wall) continue;

            wall.setStart(state.to.start);
            wall.setEnd(state.to.end);
        }

        this.executed = true;
    }

    // --------------------------------------------------------
    // Undo / Redo
    // --------------------------------------------------------

    public undo(): void {
        if (!this.executed) return;

        for (const state of this.resizeStates) {
            const wall = this.document.findWall(state.wallId);
            if (!wall) continue;

            wall.setStart(state.from.start);
            wall.setEnd(state.from.end);
        }

        this.executed = false;
    }

    public redo(): void {
        this.execute();
    }
}
