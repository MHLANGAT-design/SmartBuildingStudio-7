using MediatR;
using ProductCatalogService.Application.DTOs;

namespace ProductCatalogService.Application.Queries.PhotometricFiles;

public sealed record GetPhotometricDistributionQuery(Guid ProductId)
    : IRequest<PhotometricDistributionDto?>;