using FloorPlanService.Domain.Common;
namespace FloorPlanService.Domain.Events;
public sealed class FloorPlanCreatedEvent : DomainEvent
{
    public Guid FloorPlanId { get; }
    public FloorPlanCreatedEvent(Guid floorPlanId)
    {
        FloorPlanId = floorPlanId;
    }
}
