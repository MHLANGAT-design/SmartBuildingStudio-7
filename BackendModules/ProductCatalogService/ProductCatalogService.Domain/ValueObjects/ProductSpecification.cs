using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.ValueObjects;

public sealed class ProductSpecification : ValueObject
{
    public decimal Wattage { get; }

    public decimal Lumens { get; }

    public decimal Cri { get; }

    public decimal ColorTemperature { get; }

    public ProductSpecification(
        decimal wattage,
        decimal lumens,
        decimal cri,
        decimal colorTemperature)
    {
        Wattage = wattage;
        Lumens = lumens;
        Cri = cri;
        ColorTemperature = colorTemperature;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Wattage;
        yield return Lumens;
        yield return Cri;
        yield return ColorTemperature;
    }
}