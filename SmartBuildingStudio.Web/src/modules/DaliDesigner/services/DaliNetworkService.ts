import { DaliApi } from "@/modules/DaliDesigner/services/DaliApi";
import { DaliNetworkDTO } from "@/modules/DaliDesigner/Document/DaliDocumentSerializer";

export const DaliNetworkService = {
  load: (projectId: string, floorplanId: string, networkId?: string) => ({
    fixtures: DaliApi.getPlacedFixtures(projectId, floorplanId),
    network: networkId ? DaliApi.getDaliNetwork(projectId, networkId) : Promise.resolve(null),
  }),

  save: (dto: DaliNetworkDTO) =>
    dto.id
      ? DaliApi.updateDaliNetwork(dto.projectId, dto.id, dto)
      : DaliApi.createDaliNetwork(dto.projectId, dto),
};