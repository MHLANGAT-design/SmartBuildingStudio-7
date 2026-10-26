using MediatR;
using ProductCatalogService.Application.DTOs;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Application.Handlers;

public sealed class GetManufacturerStatsQueryHandler
    : IRequestHandler<GetManufacturerStatsQuery, IReadOnlyCollection<ManufacturerStatsDto>>
{
    private readonly IProductReadService _readService;

    public GetManufacturerStatsQueryHandler(IProductReadService readService)
    {
        _readService = readService;
    }

    public Task<IReadOnlyCollection<ManufacturerStatsDto>> Handle(
        GetManufacturerStatsQuery request,
        CancellationToken cancellationToken)
        => _readService.GetManufacturerStatsAsync();
}