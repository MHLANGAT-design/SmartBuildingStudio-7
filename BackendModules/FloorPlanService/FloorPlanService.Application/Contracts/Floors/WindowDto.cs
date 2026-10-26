using FloorPlanService.Application.Contracts.Common;

namespace FloorPlanService.Application.Contracts.Floors;

public record WindowDto(
    string Id,
    string WallId,
    PointDto Position,
    double Width,
    double Height,
    double Transmittance,
    StyleDto? Style
);