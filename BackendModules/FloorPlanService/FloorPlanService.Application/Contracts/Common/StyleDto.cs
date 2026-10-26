namespace FloorPlanService.Application.Contracts.Common;

public record StyleDto(
    string? StrokeColor,
    string? FillColor,
    double? StrokeWidth,
    double? Opacity
);