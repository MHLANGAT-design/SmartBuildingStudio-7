using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Entities;

public sealed class ProductCategory : Entity
{
    public string Name { get; private set; }

    private ProductCategory()
    {
        Name = string.Empty;
    }

    public ProductCategory(string name)
    {
        Name = name;
    }
}