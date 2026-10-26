import { DaliNetwork } from "@/modules/DaliDesigner/models/DaliNetwork";

export type DaliDocument = DaliNetwork;

export function createEmptyDaliDocument(
  projectId: string,
  floorplanId: string,
  name = "New DALI Network"
): DaliDocument {
  return {
    id: null,
    projectId,
    floorplanId,
    name,
    revision: 0,
    updatedAt: new Date().toISOString(),
    lines: [],
    devices: [],
    groups: [],
    scenes: [],
    topology: { edges: [], powerSupplies: [] },
    commissioning: "not-commissioned",
  };
}