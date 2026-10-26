namespace ProductCatalogService.Application.Queries.Products;

/// <summary>
/// Optional filter object for GetProductsQuery. All fields are
/// optional; null means "no filter on this dimension". Multiple
/// filters combine with AND.
/// </summary>
/// <param name="Manufacturer">
/// Case-insensitive exact match on the product's manufacturer name.
/// </param>
/// <param name="Family">
/// Case-insensitive exact match on the product's family / series.
/// </param>
/// <param name="ProductType">
/// Numeric value of the ProductType enum (1 = Luminaire, 2 = Driver, …).
/// </param>
/// <param name="Search">
/// Substring match (case-insensitive) across Name, ProductCode, and
/// Manufacturer. Intended for free-text search boxes.
/// </param>
public sealed record ProductFilters(
    string? Manufacturer = null,
    string? Family = null,
    int? ProductType = null,
    string? Search = null)
{
    /// <summary>True when no filters are set — equivalent to GetAllAsync.</summary>
    public bool IsEmpty =>
        Manufacturer is null &&
        Family is null &&
        ProductType is null &&
        string.IsNullOrWhiteSpace(Search);
}