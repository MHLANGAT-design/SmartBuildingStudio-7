import { DaliDocument } from "@/modules/DaliDesigner/Document/DaliDocument";

export interface DaliNetworkDTO {
  id?: string;
  projectId: string;
  floorplanId: string;
  name: string;
  revision: number;
  updatedAt: string;
  lines: unknown[];
  devices: unknown[];
  groups: unknown[];
  scenes: unknown[];
  topology: unknown;
  commissioning: string;
}

export const DaliDocumentSerializer = {
  toDTO(doc: DaliDocument): DaliNetworkDTO {
    return {
      id: doc.id ?? undefined,
      projectId: doc.projectId,
      floorplanId: doc.floorplanId,
      name: doc.name,
      revision: doc.revision,
      updatedAt: doc.updatedAt,
      lines: doc.lines,
      devices: doc.devices,
      groups: doc.groups,
      scenes: doc.scenes,
      topology: doc.topology,
      commissioning: doc.commissioning,
    };
  },

  fromDTO(dto: DaliNetworkDTO): DaliDocument {
    return {
      id: dto.id ?? null,
      projectId: dto.projectId,
      floorplanId: dto.floorplanId,
      name: dto.name,
      revision: dto.revision ?? 0,
      updatedAt: dto.updatedAt ?? new Date().toISOString(),
      lines: (dto.lines as DaliDocument["lines"]) ?? [],
      devices: (dto.devices as DaliDocument["devices"]) ?? [],
      groups: (dto.groups as DaliDocument["groups"]) ?? [],
      scenes: (dto.scenes as DaliDocument["scenes"]) ?? [],
      topology: (dto.topology as DaliDocument["topology"]) ?? { edges: [], powerSupplies: [] },
      commissioning: (dto.commissioning as DaliDocument["commissioning"]) ?? "not-commissioned",
    };
  },
};