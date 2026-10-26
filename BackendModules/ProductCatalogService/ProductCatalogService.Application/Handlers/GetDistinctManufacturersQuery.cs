using MediatR;

namespace ProductCatalogService.Application.Queries.Products;

/// <summary>
/// List the distinct manufacturer names present in the catalog.
/// Empty entries (products without a manufacturer) are excluded.
/// </summary>
public sealed record GetDistinctManufacturersQuery()
    : IRequest<IReadOnlyCollection<string>>;