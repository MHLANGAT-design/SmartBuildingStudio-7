using BuildingBlocks.Domain;
using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Domain.Aggregates;

public sealed class ProductCatalog : AggregateRoot
{
    private readonly List<Product> _products = [];

    public string CatalogName { get; private set; }

    public IReadOnlyCollection<Product> Products => _products;

    private ProductCatalog()
    {
        CatalogName = string.Empty;
    }

    public ProductCatalog(string catalogName)
    {
        CatalogName = catalogName;
    }

    public void AddProduct(Product product)
    {
        _products.Add(product);
    }
}