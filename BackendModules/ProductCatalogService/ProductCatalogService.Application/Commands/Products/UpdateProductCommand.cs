using MediatR;

namespace ProductCatalogService.Application.Commands.Products;

public sealed record UpdateProductCommand(
    Guid ProductId,
    string Name,
    decimal Wattage,
    decimal Lumens,
    decimal Cri,
    decimal ColorTemperature
) : IRequest;