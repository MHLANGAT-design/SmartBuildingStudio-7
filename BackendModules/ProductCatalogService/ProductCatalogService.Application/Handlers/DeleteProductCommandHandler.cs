using MediatR;
using ProductCatalogService.Application.Commands.Products;
using ProductCatalogService.Domain.Repositories;

namespace ProductCatalogService.Application.Handlers;

/// <summary>
/// Handles DeleteProductCommand.
///
/// Delegates to <see cref="IProductRepository.DeleteAsync"/>, which
/// performs the EF Core Remove + SaveChanges. Deleting a non-existent
/// product is a no-op — the endpoint responds 204 either way, which
/// makes it idempotent.
/// </summary>
public sealed class DeleteProductCommandHandler
    : IRequestHandler<DeleteProductCommand, Unit>
{
    private readonly IProductRepository _products;

    public DeleteProductCommandHandler(IProductRepository products)
    {
        _products = products;
    }

    public async Task<Unit> Handle(
        DeleteProductCommand request,
        CancellationToken cancellationToken)
    {
        await _products.DeleteAsync(request.ProductId);
        return Unit.Value;
    }
}