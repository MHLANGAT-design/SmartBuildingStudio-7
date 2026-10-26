using FloorPlanService.Application.Contracts.Documents;

namespace FloorPlanService.Application.Contracts.Documents;

public record FloorPlanDocumentDto(
    string Id,
    string Name,
    string? ActiveProjectId,
    string? ActiveProjectName,
    string? ActiveBuildingId,
    string? ActiveBuildingName,
    string? ActiveFloorId,
    string? ActiveFloorName,
    string? ActiveDocumentName,
    FloorDto[] Floors,
    ImportedDrawingDto[] ImportedDrawings,
    ElectricalFixtureDto[] ElectricalFixtures,
    LayerDto[] Layers,
    DateTime? CreatedAt,
    DateTime? LastModified,
    int Version
);