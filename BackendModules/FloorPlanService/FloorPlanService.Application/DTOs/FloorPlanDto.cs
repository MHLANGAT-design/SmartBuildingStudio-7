// FloorPlanService.Application/DTOs/FloorPlanDto.cs

using FloorPlanService.Application.Contracts.Documents;

namespace FloorPlanService.Application.DTOs;

public record FloorPlanDto(
    string Id,
    string Name,
    FloorDto[] Floors,
    LayerDto[] Layers,
    ImportedDrawingDto[] ImportedDrawings,
    ElectricalFixtureDto[] ElectricalFixtures,
    double PixelsToMetresScale
);