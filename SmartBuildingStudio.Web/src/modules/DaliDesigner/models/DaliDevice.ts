// src/modules/DaliDesigner/models/DaliDevice.ts
export type DeviceKind = "Ballast" | "Sensor" | "Switch";

export interface DaliDevice {
  id: string;
  sourceFixtureId: string;
  kind: DeviceKind;
  label: string;
  lineId: string | null;
  address: number | null;
  groupIds: string[];
  metadata: {
    /** Product catalog description, when available. */
    luminaireType?: string;
    wattage?: number;
    position?: { x: number; y: number };
    productId?: string;
    roomId?: string;
    roomName?: string;
    /**
     * Original fixture kind from FixturePlacementStudio —
     * "luminaire" | "emergencyLight" | "sensor" | "switch" | etc.
     *
     * Preserved because DALI's behavioral DeviceKind (Ballast / Sensor /
     * Switch) collapses emergency lights into Ballast, but the UI still
     * needs to render them distinctly.
     */
    sourceKind?: string;
  };
}