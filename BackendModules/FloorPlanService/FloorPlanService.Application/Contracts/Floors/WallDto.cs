using FloorPlanService.Application.Contracts.Common;

namespace FloorPlanService.Application.Contracts.Floors;

public record WallDto(
    string Id,
    PointDto Start,
    PointDto End,
    double Thickness,
    double Height,
    string Material,
    StyleDto? Style
);