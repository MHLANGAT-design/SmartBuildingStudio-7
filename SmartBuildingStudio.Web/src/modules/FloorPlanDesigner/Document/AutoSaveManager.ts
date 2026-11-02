// src/modules/FloorPlanDesigner/Document/AutoSaveManager.ts

import { BackendPayloadMapper } from "@/modules/FloorPlanDesigner/Store/BackendPayloadMapper";

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

/**
 * AutoSaveManager — periodically serializes the current floor plan and
 * hands the JSON to a callback.
 *
 * IMPORTANT: `start()` is not called anywhere yet. Autosave is opt-in —
 * plans under active development should not be auto-saved to production
 * storage until the user explicitly enables it.
 *
 * Serialization uses BackendPayloadMapper.toLegacyBackend, matching the
 * payload shape produced by the saveDrawing thunk. AutoSaveManager is
 * agnostic about whether the callback persists to the backend, a version
 * manager, or just logs — the callback decides.
 */
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
        getDocument: () => any,
        onAutoSave: (json: string) => void
    ): void {
        if (!this.enabled || this.timer) {
            return;
        }

        this.timer = setInterval(() => {
            try {
                const document = getDocument();
                if (!document) return;

                const payload = BackendPayloadMapper.toLegacyBackend(document);
                const json = JSON.stringify(payload);

                // Skip save if nothing has changed since the last snapshot
                if (json === this.lastSnapshot) return;

                this.lastSnapshot = json;
                this.lastAutoSave = new Date();
                onAutoSave(json);
            } catch (e: any) {
                console.warn("[AutoSaveManager] Autosave tick failed:", e?.message || e);
            }
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
        getDocument: () => any,
        callback: (json: string) => void
    ): void {
        this.stop();
        this.start(getDocument, callback);
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

export default AutoSaveManager;