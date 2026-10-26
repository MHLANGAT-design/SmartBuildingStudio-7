using FloorPlanService.Application.Contracts.Floors;

namespace FloorPlanService.Application.Contracts.Documents;

public record FloorDto(
    string Id,
    string Name,
    int LevelIndex,
    double ElevationHeightMeters,
    WallDto[] Walls,
    DoorDto[] Doors,
    WindowDto[] Windows,
    RoomDto[] Rooms
);