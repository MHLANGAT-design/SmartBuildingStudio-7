namespace ProductCatalogService.Api.Requests;

public sealed record CreateManufacturerRequest(
    string Name,
    string Website
);