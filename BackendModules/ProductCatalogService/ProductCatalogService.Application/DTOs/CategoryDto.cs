namespace ProductCatalogService.Application.DTOs;

public sealed record CategoryDto(
    Guid Id,
    string Name
);