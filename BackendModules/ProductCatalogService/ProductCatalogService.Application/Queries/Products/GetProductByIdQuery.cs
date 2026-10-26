using MediatR;
using ProductCatalogService.Application.DTOs;

namespace ProductCatalogService.Application.Queries.Products;

/// <summary>
/// Fetch a single product by id. Returns null when no product with
/// the given id exists.
/// </summary>
public sealed record GetProductByIdQuery(Guid ProductId)
    : IRequest<ProductDto?>;