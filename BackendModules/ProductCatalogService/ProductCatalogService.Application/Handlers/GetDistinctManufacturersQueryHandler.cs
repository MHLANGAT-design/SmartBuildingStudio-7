using MediatR;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Application.Handlers;

/// <summary>
/// Handles GetDistinctManufacturersQuery. Delegates to the read service.
/// </summary>
public sealed class GetDistinctManufacturersQueryHandler
    : IRequestHandler<GetDistinctManufacturersQuery, IReadOnlyCollection<string>>
{
    private readonly IProductReadService _readService;

    public GetDistinctManufacturersQueryHandler(IProductReadService readService)
    {
        _readService = readService;
    }

    public Task<IReadOnlyCollection<string>> Handle(
        GetDistinctManufacturersQuery request,
        CancellationToken cancellationToken)
        => _readService.GetDistinctManufacturersAsync();
}