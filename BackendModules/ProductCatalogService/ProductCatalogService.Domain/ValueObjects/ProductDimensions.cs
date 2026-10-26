using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.ValueObjects;

public sealed class ProductDimensions : ValueObject
{
    public decimal Length { get; }

    public decimal Width { get; }

    public decimal Height { get; }

    public ProductDimensions(decimal length, decimal width, decimal height)
    {
        Length = length;
        Width = width;
        Height = height;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Length;
        yield return Width;
        yield return Height;
    }
}