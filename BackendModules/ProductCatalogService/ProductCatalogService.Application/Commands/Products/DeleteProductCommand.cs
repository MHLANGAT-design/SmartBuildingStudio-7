using MediatR;

namespace ProductCatalogService.Application.Commands.Products;

/// <summary>
/// Delete a product by id. Idempotent — deleting a non-existent
/// product is a no-op.
/// </summary>
public sealed record DeleteProductCommand(Guid ProductId)
    : IRequest<Unit>;