using FloorPlanService.Application.Contracts.Common;

namespace FloorPlanService.Application.Contracts.Floors;

public record DoorDto(
    string Id,
    string WallId,
    PointDto Position,
    double Width,
    double Height,
    string DoorType,
    string Swing,
    StyleDto? Style
);