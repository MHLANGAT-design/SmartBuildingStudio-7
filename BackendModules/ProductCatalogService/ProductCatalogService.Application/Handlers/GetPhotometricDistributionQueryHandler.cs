using MediatR;
using ProductCatalogService.Application.DTOs;
using ProductCatalogService.Application.Queries.PhotometricFiles;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.Repositories;

namespace ProductCatalogService.Application.Handlers;

public sealed class GetPhotometricDistributionQueryHandler
    : IRequestHandler<GetPhotometricDistributionQuery, PhotometricDistributionDto?>
{
    private readonly IProductRepository _products;

    public GetPhotometricDistributionQueryHandler(IProductRepository products)
    {
        _products = products;
    }

    public async Task<PhotometricDistributionDto?> Handle(
        GetPhotometricDistributionQuery request,
        CancellationToken cancellationToken)
    {
        var product = await _products.GetByIdAsync(request.ProductId);
        if (product is null) return null;

        var active = product.PhotometricFiles
            .FirstOrDefault(f => f.IsActive);
        if (active is null) return null;

        var samples = active.Samples
            .Select(s => new CandelaSampleDto(
                s.HorizontalAngle,
                s.VerticalAngle,
                s.Candela))
            .ToArray();

        return new PhotometricDistributionDto(
            ProductId: product.Id,
            Samples: samples,
            TotalLumens: active.TotalLumens ?? 0,
            EfficacyLmPerW: null,       // from LuminaireSpecification, next slice
            Symmetry: active.Symmetry switch
            {
                PhotometricSymmetry.None => "none",
                PhotometricSymmetry.Rotational => "rotational",
                PhotometricSymmetry.Quadrantal => "quadrantal",
                PhotometricSymmetry.Bilateral => "bilateral",
                _ => "none",
            },
            SourceFile: active.FileName);
    }
}