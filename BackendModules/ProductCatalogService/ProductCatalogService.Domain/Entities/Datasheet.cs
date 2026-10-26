using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Entities;

public sealed class Datasheet : Entity
{
    public string FileName { get; private set; }

    public string Url { get; private set; }

    private Datasheet()
    {
        FileName = string.Empty;
        Url = string.Empty;
    }

    public Datasheet(string fileName, string url)
    {
        FileName = fileName;
        Url = url;
    }
}