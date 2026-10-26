using MediatR;
using ProductCatalogService.Application.DTOs;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Application.Handlers;

/// <summary>
/// Handles GetProductsQuery. Delegates to the read service, which
/// builds the conditional EF query. Keeps the handler free of
/// persistence concerns.
/// </summary>
public sealed class GetProductsQueryHandler
    : IRequestHandler<GetProductsQuery, IReadOnlyCollection<ProductDto>>
{
    private readonly IProductReadService _readService;

    public GetProductsQueryHandler(IProductReadService readService)
    {
        _readService = readService;
    }

    public Task<IReadOnlyCollection<ProductDto>> Handle(
        GetProductsQuery request,
        CancellationToken cancellationToken)
        => _readService.FindAsync(request.Filters);
}