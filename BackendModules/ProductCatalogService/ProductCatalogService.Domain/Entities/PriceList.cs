using BuildingBlocks.Domain;
using ProductCatalogService.Domain.ValueObjects;

namespace ProductCatalogService.Domain.Entities;

public sealed class PriceList : Entity
{
    public ProductPrice Price { get; private set; }

    private PriceList()
    {
        Price = new ProductPrice(0, "USD");
    }

    public PriceList(
        ProductPrice price)
    {
        Price = price;
    }
}
