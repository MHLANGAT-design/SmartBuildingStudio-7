// FloorPlanSnapHook.ts
// COMPLETE FILE - Replace everything

export interface SnapPoint {
    world: { x: number; y: number; z?: number; [key: string]: any };
    screen: { x: number; y: number };
}

export const FloorPlanSnapHook = {
    // 📦 Internal State Storage: Holds the active snapped point across coordinate systems.
    currentSnapPoint: null as SnapPoint | null,

    /**
     * 🟢 1. ENGINE REGISTRATION INJECTOR
     * Keeps track of exactly where the user is hovering in both 3D/DWG space and Screen space.
     */
    updateSnapTarget(worldVertex: any, viewport: any): void {
        if (!worldVertex || !viewport) {
            this.currentSnapPoint = null;
            return;
        }

        try {
            this.currentSnapPoint = {
                world: { x: worldVertex.x, y: worldVertex.y },
                // Instantly translate the raw world point to physical canvas screen pixels
                screen: viewport.worldToScreen(worldVertex)
            };
        } catch (error) {
            console.warn("[CAD Snap Hook Error]: Failed to translate coordinates via viewport reference", error);
            this.currentSnapPoint = null;
        }
    },

    /**
     * 🔴 2. CENTRAL TOOL LIFECYCLE INTERCEPTOR
     * Automatically invoked via `BaseTool.ts` when a tool activates.
     * Mutates the tool's uninitialized track variables before its first execution loop.
     * 
     * @param toolInstance The executing child tool class structure (WallTool, DoorTool, etc.)
     * @returns boolean - True if the tool successfully hijacked an active vertex snap point.
     */
    initializeToolToSnap(toolInstance: any): boolean {
        // Guard barrier: If the user is not actively snapped to an object, fall back safely.
        if (!this.currentSnapPoint || !toolInstance) {
            return false;
        }

        const { screen, world } = this.currentSnapPoint;

        // 🚀 FIXED PROPERTY SCHEMAS: 
        // Populate standard primitive properties using true world space coordinates 
        // to handle absolute high-magnitude UTM configurations cleanly.
        if ("startX" in toolInstance) toolInstance.startX = world.x;
        if ("startY" in toolInstance) toolInstance.startY = world.y;
        if ("currentX" in toolInstance) toolInstance.currentX = world.x;
        if ("currentY" in toolInstance) toolInstance.currentY = world.y;

        // 🚀 FIXED WINDOW & DOOR TOOLS ANCHORS:
        // Inject properties matching your fixture tools' vector positioning logic.
        if ("startPoint" in toolInstance) {
            toolInstance.startPoint = { x: world.x, y: world.y };
        }
        if ("currentPoint" in toolInstance) {
            toolInstance.currentPoint = { x: world.x, y: world.y };
        }

        // 🚀 FIXED ROOM TOOL VERTICES POOL:
        // If the tool is RoomTool or WallTool, automatically seed its tracking array 
        // with the snapped coordinate point so it doesn't default back to (0,0).
        if (toolInstance.vertices && Array.isArray(toolInstance.vertices)) {
            toolInstance.vertices.length = 0; // Clear any placeholder nodes
            toolInstance.vertices.push({ x: world.x, y: world.y });
        }

        // Deep 3D Coordinate Propagation for downstream engine contexts
        if (toolInstance.worldPosition && world) {
            if (typeof toolInstance.worldPosition.copy === "function") {
                toolInstance.worldPosition.copy(world);
            } else {
                Object.assign(toolInstance.worldPosition, world);
            }
        }

        // Custom state flag to allow specialized rendering variations in child tools
        toolInstance.hasInitialSnap = true;
        return true;
    },

    /**
     * 🟡 3. MANUAL RESET SYSTEM
     */
    clear(): void {
        this.currentSnapPoint = null;
    }
};

// WINDOW ENVIRONMENT STANDARDIZATION LOCK
(window as any).FloorPlanSnapHook = FloorPlanSnapHook;

export default FloorPlanSnapHook;
