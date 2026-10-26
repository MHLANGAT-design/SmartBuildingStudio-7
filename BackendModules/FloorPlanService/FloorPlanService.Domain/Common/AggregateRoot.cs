namespace FloorPlanService.Domain.Common;
public abstract class AggregateRoot : EntityBase
{
    private readonly List<DomainEvent> _events = new();
    public IReadOnlyCollection<DomainEvent> Events => _events.AsReadOnly();
    protected void AddEvent(DomainEvent domainEvent)
    {
        _events.Add(domainEvent);
    }
    public void ClearEvents()
    {
        _events.Clear();
    }
}
