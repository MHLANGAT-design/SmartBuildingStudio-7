using BuildingBlocks.Domain;

namespace ProductCatalogService.Domain.Events;

public sealed class ProductCreatedEvent : DomainEvent
{
    public Guid ProductId { get; }

    public ProductCreatedEvent(Guid productId)
    {
        ProductId = productId;
    }
}