namespace FloorPlanService.Application.Contracts.Documents;

public record ImportedDrawingDto(
    string Id,
    string FileName,
    int? FileSize,
    double? ScaleFactor,
    double? OffsetX,
    double? OffsetY,
    double? RotationDegrees,
    double? Opacity,
    double? StartX,
    double? StartY,
    double? EndX,
    double? EndY
);