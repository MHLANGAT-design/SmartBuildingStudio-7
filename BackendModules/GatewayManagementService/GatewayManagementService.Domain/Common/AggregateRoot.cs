using System.Collections.Generic;

namespace GatewayManagementService.Domain.Common;

public abstract class AggregateRoot<TId> : Entity<TId> where TId : notnull
{
    private readonly List<DomainEvent> _domainEvents = new();

    public IReadOnlyCollection<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void RaiseDomainEvent(DomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}