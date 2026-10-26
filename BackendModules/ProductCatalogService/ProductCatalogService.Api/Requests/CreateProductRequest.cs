namespace ProductCatalogService.Api.Requests;

public sealed record CreateProductRequest(
    string ProductCode,
    string Name,
    int ProductType,
    decimal Wattage,
    decimal Lumens,
    decimal Cri,
    decimal ColorTemperature,
    string Manufacturer
);