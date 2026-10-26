using MediatR;

namespace ProductCatalogService.Application.Commands.Products;

public sealed record CreateProductCommand(
    string ProductCode,
    string Name,
    int ProductType,
    decimal Wattage,
    decimal Lumens,
    decimal Cri,
    decimal ColorTemperature,
    string Manufacturer,
    string? Family = null,
    string? Specifications = null
) : IRequest<Guid>;