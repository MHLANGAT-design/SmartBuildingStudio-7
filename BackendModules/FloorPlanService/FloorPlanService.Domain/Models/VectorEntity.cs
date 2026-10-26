using System.Collections.Generic;

namespace FloorPlanService.Domain.Models;

public record Vector2D(double X, double Y);

public record VectorEntity(
    string Id,
    ElementType Type,
    string OriginalLayer,
    List<Vector2D> Points,
    double Rotation = 0,
    string? Kind = null,
    string? GroupId = null,
    string? BlockName = null
);