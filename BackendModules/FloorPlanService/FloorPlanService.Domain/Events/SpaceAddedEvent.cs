using FloorPlanService.Domain.Common;
namespace FloorPlanService.Domain.Events;
public sealed class SpaceAddedEvent : DomainEvent
{
    public Guid FloorPlanId { get; }
    public Guid SpaceId { get; }
    public SpaceAddedEvent(Guid floorPlanId, Guid spaceId)
    {
        FloorPlanId = floorPlanId;
        SpaceId = spaceId;
    }
}
