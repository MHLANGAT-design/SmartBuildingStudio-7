using FloorPlanService.Application.Contracts.Common;

namespace FloorPlanService.Application.Contracts.Floors;

public record RoomDto(
    string Id,
    string Name,
    PointDto[] Vertices,
    int TargetLux,
    string SpaceType,
    double Area,
    StyleDto? Style
);