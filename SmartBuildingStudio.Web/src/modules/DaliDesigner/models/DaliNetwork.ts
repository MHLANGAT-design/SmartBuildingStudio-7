import { DaliLine } from "@/modules/DaliDesigner/models/DaliLine";
import { DaliDevice } from "@/modules/DaliDesigner/models/DaliDevice";
import { Group } from "@/modules/DaliDesigner/models/Group";
import { Scene } from "@/modules/DaliDesigner/models/Scene";
import { NetworkTopology } from "@/modules/DaliDesigner/models/NetworkTopology";

export type CommissioningStatus =
  | "not-commissioned"
  | "in-progress"
  | "commissioned"
  | "failed";

export interface DaliNetwork {
  id: string | null;
  projectId: string;
  floorplanId: string;
  name: string;
  revision: number;
  updatedAt: string;
  lines: DaliLine[];
  devices: DaliDevice[];
  groups: Group[];
  scenes: Scene[];
  topology: NetworkTopology;
  commissioning: CommissioningStatus;
}