using FloorPlanService.Domain.Common;
namespace FloorPlanService.Domain.Events;
public sealed class WallAddedEvent : DomainEvent
{
    public Guid FloorPlanId { get; }
    public Guid WallId { get; }
    public WallAddedEvent(Guid floorPlanId, Guid wallId)
    {
        FloorPlanId = floorPlanId;
        WallId = wallId;
    }
}
