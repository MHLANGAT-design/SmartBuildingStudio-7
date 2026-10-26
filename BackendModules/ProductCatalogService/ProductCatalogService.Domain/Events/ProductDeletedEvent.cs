using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Events;

public sealed class ProductDeletedEvent : DomainEvent
{
    public Guid ProductId { get; }

    public ProductDeletedEvent(Guid productId)
    {
        ProductId = productId;
    }
}