// FloorPlanService.Application/Contracts/Documents/FloorGeometryDto.cs

using FloorPlanService.Application.Contracts.Floors;

namespace FloorPlanService.Application.Contracts.Documents;

public record FloorGeometryDto(
    WallDto[] Walls,
    DoorDto[] Doors,
    WindowDto[] Windows
);