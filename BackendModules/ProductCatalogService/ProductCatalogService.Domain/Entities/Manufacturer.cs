using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Entities;

public sealed class Manufacturer : Entity
{
    public string Name { get; private set; }

    public string Website { get; private set; }

    private Manufacturer()
    {
        Name = string.Empty;
        Website = string.Empty;
    }

    public Manufacturer(string name, string website)
    {
        Name = name;
        Website = website;
    }
}