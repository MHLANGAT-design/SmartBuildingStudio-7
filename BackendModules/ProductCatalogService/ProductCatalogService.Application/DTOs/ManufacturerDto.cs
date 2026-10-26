namespace ProductCatalogService.Application.DTOs;

public sealed record ManufacturerDto(
    Guid Id,
    string Name,
    string Website
);