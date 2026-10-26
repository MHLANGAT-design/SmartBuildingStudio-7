namespace ProductCatalogService.Api.Requests;

public sealed record UpdateProductRequest(
    string Name,
    decimal Wattage,
    decimal Lumens,
    decimal Cri,
    decimal ColorTemperature
);