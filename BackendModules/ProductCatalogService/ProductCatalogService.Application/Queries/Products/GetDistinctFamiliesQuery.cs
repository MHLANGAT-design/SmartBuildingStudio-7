using MediatR;

namespace ProductCatalogService.Application.Queries.Products;

/// <summary>
/// List the distinct family names present in the catalog. Products
/// with no family (null or empty) are excluded.
/// </summary>
public sealed record GetDistinctFamiliesQuery()
    : IRequest<IReadOnlyCollection<string>>;