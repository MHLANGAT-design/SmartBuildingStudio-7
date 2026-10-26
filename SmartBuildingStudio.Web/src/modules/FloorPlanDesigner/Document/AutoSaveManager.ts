import { DrawingDocument } from "@/modules/FloorPlanDesigner/Document/DrawingDocument";
import { DocumentSerializer } from "@/modules/FloorPlanDesigner/Document/DocumentSerializer";

export interface AutoSaveOptions {
    /**
     * Autosave interval in milliseconds.
     */
    interval?: number;

    /**
     * Enable autosave immediately.
     */
    enabled?: boolean;
}

export class AutoSaveManager {
    private enabled: boolean;
    private interval: number;
    private timer?: ReturnType<typeof setInterval>;
    private lastAutoSave?: Date;
    private lastSnapshot?: string;

    constructor(options?: AutoSaveOptions) {
        this.interval = options?.interval ?? 300000; // 5 minutes
        this.enabled = options?.enabled ?? true;
    }

    // --------------------------------------------------------
    // Control
    // --------------------------------------------------------

    public start(
        document: DrawingDocument,
        onAutoSave: (json: string) => void
    ): void {
        if (!this.enabled || this.timer) {
            return;
        }

        this.timer = setInterval(() => {
            const json = DocumentSerializer.toJson(document, false);
            this.lastSnapshot = json;
            this.lastAutoSave = new Date();
            onAutoSave(json);
        }, this.interval);
    }

    public stop(): void {
        if (!this.timer) {
            return;
        }

        clearInterval(this.timer);
        this.timer = undefined;
    }

    public restart(
        document: DrawingDocument,
        callback: (json: string) => void
    ): void {
        this.stop();
        this.start(document, callback);
    }

    // --------------------------------------------------------
    // Configuration
    // --------------------------------------------------------

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    public getInterval(): number {
        return this.interval;
    }

    public setInterval(interval: number): void {
        this.interval = Math.max(1000, interval);
    }

    // --------------------------------------------------------
    // Information
    // --------------------------------------------------------

    public getLastAutoSave(): Date | undefined {
        return this.lastAutoSave;
    }

    public getLastSnapshot(): string | undefined {
        return this.lastSnapshot;
    }

    public isRunning(): boolean {
        return this.timer !== undefined;
    }
}
