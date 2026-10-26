using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Events;

public sealed class ProductUpdatedEvent : DomainEvent
{
    public Guid ProductId { get; }

    public ProductUpdatedEvent(Guid productId)
    {
        ProductId = productId;
    }
}