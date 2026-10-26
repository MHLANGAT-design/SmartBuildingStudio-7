using MediatR;
using ProductCatalogService.Application.Commands.Products;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.ValueObjects;
using ProductCatalogService.Infrastructure.Persistence;

namespace ProductCatalogService.Infrastructure.Handlers;

public sealed class CreateProductCommandHandler
    : IRequestHandler<CreateProductCommand, Guid>
{
    private readonly ProductCatalogDbContext _db;

    public CreateProductCommandHandler(ProductCatalogDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(
        CreateProductCommand request,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(typeof(ProductType), request.ProductType))
        {
            throw new ArgumentException(
                $"Invalid ProductType value: {request.ProductType}",
                nameof(request));
        }

        var specification = new ProductSpecification(
            request.Wattage,
            request.Lumens,
            request.Cri,
            request.ColorTemperature);

        var dimensions = new ProductDimensions(0, 0, 0);

        var product = new Product(
            productCode: new ProductCode(request.ProductCode),
            name: request.Name,
            productType: (ProductType)request.ProductType,
            specification: specification,
            dimensions: dimensions,
            manufacturer: request.Manufacturer,
            family: request.Family,
            specifications: request.Specifications);

        _db.Products.Add(product);
        await _db.SaveChangesAsync(cancellationToken);

        return product.Id;
    }
}