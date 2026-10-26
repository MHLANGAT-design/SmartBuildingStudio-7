using MediatR;
using ProductCatalogService.Application.DTOs;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Application.Handlers;

/// <summary>
/// Handles GetProductByIdQuery. Returns null when no product matches.
/// </summary>
public sealed class GetProductByIdQueryHandler
    : IRequestHandler<GetProductByIdQuery, ProductDto?>
{
    private readonly IProductReadService _readService;

    public GetProductByIdQueryHandler(IProductReadService readService)
    {
        _readService = readService;
    }

    public async Task<ProductDto?> Handle(
        GetProductByIdQuery request,
        CancellationToken cancellationToken)
        => await _readService.GetByIdAsync(request.ProductId);
}