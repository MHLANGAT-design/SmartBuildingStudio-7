using MediatR;
using ProductCatalogService.Application.DTOs;

namespace ProductCatalogService.Application.Queries.Products;

/// <summary>
/// List products with optional filters. When <c>Filters</c> is null
/// or empty, all products are returned.
///
/// All filters combine with AND. Filter semantics:
///   • Manufacturer — case-insensitive exact match
///   • Family       — case-insensitive exact match
///   • ProductType  — numeric enum value
///   • Search       — case-insensitive substring across
///                    Name, ProductCode, and Manufacturer
///
/// Returns an empty collection when no products match — callers
/// distinguish "no products" from "error" by the response shape.
/// </summary>
public sealed record GetProductsQuery(ProductFilters? Filters = null)
    : IRequest<IReadOnlyCollection<ProductDto>>;