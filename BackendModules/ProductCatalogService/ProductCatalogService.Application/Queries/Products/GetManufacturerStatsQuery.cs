using MediatR;
using ProductCatalogService.Application.DTOs;

namespace ProductCatalogService.Application.Queries.Products;

/// <summary>
/// Aggregate the catalog by manufacturer. One row per distinct
/// manufacturer name, sorted alphabetically. Products with an empty
/// or null Manufacturer are excluded.
/// </summary>
public sealed record GetManufacturerStatsQuery()
    : IRequest<IReadOnlyCollection<ManufacturerStatsDto>>;