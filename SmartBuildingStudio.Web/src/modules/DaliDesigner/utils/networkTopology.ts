import { NetworkTopology } from "@/modules/DaliDesigner/models/NetworkTopology";

export function buildTopology(edges: Array<{ from: string; to: string }>): NetworkTopology {
  return { edges, powerSupplies: [] };
}