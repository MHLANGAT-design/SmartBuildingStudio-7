export interface NetworkTopology {
  edges: Array<{ from: string; to: string }>;
  powerSupplies: Array<{ id: string; lineId: string; wattage: number }>;
}