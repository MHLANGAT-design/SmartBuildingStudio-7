using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.ValueObjects;

public sealed class ProductPrice : ValueObject
{
    public decimal Amount { get; }

    public string Currency { get; }

    public ProductPrice(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}