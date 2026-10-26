namespace ProductCatalogService.Application.DTOs;

public sealed record CandelaSampleDto(
    double HorizontalAngle,
    double VerticalAngle,
    double Candela);

public sealed record PhotometricDistributionDto(
    Guid ProductId,
    IReadOnlyCollection<CandelaSampleDto> Samples,
    double TotalLumens,
    double? EfficacyLmPerW,
    string? Symmetry,
    string? SourceFile);