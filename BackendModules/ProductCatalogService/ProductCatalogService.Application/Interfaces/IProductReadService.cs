using ProductCatalogService.Application.DTOs;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Application.Interfaces;

/// <summary>
/// Read-side service for products. Returns DTOs directly, bypassing
/// the domain model. Used by query handlers that only need projection
/// and not aggregate behavior.
/// </summary>
public interface IProductReadService
{
    /// <summary>
    /// Fetch a single product by id. Returns null when no product matches.
    /// </summary>
    Task<ProductDto?> GetByIdAsync(Guid productId);

    /// <summary>
    /// Find products matching the given filters. Null or empty filters
    /// return all products. All filters combine with AND.
    /// </summary>
    Task<IReadOnlyCollection<ProductDto>> FindAsync(ProductFilters? filters);

    /// <summary>
    /// Distinct manufacturer names, sorted alphabetically.
    /// Excludes empty/null values.
    /// </summary>
    Task<IReadOnlyCollection<string>> GetDistinctManufacturersAsync();

    /// <summary>
    /// Distinct family names, sorted alphabetically.
    /// Excludes null/empty values.
    /// </summary>
    Task<IReadOnlyCollection<string>> GetDistinctFamiliesAsync();

    /// <summary>
    /// Aggregate the catalog by manufacturer: one row per distinct
    /// manufacturer name with its product count. Excludes products
    /// with an empty/null Manufacturer. Sorted alphabetically.
    /// </summary>
    Task<IReadOnlyCollection<ManufacturerStatsDto>> GetManufacturerStatsAsync();
}