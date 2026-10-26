namespace BuildingBlocks.Domain;

/// <summary>
/// Base class for domain events.
///
/// Declared as a class (not a record) because the concrete events
/// in ProductCatalogService.Domain (ProductCreatedEvent,
/// ProductDeletedEvent, ProductUpdatedEvent, PhotometricFileUploadedEvent)
/// are declared as sealed classes. A class cannot inherit from a
/// record, so this base must be a class.
/// </summary>
public abstract class DomainEvent : IDomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredOn { get; init; } = DateTime.UtcNow;
}