using MediatR;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Application.Handlers;

public sealed class GetDistinctFamiliesQueryHandler
    : IRequestHandler<GetDistinctFamiliesQuery, IReadOnlyCollection<string>>
{
    private readonly IProductReadService _readService;

    public GetDistinctFamiliesQueryHandler(IProductReadService readService)
    {
        _readService = readService;
    }

    public Task<IReadOnlyCollection<string>> Handle(
        GetDistinctFamiliesQuery request,
        CancellationToken cancellationToken)
        => _readService.GetDistinctFamiliesAsync();
}