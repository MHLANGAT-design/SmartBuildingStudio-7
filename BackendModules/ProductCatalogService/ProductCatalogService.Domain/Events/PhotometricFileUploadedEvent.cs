using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Events;

public sealed class PhotometricFileUploadedEvent : DomainEvent
{
    public Guid ProductId { get; }

    public string FileName { get; }

    public PhotometricFileUploadedEvent(
        Guid productId,
        string fileName)
    {
        ProductId = productId;
        FileName = fileName;
    }
}