namespace ProductCatalogService.Application.DTOs;

/// <summary>
/// One row of manufacturer aggregate data used by the manufacturer
/// admin page. Derived from the products table by grouping on the
/// denormalized Manufacturer field.
/// </summary>
public sealed record ManufacturerStatsDto(
    /// <summary>Manufacturer name as it appears on products.</summary>
    string Name,
    /// <summary>Number of products in the catalog with this manufacturer.</summary>
    int ProductCount
);