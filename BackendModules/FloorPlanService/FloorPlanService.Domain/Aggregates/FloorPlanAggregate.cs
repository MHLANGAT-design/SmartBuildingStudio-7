using FloorPlanService.Domain.Common;
using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Events;
namespace FloorPlanService.Domain.Aggregates;
public class FloorPlanAggregate : AggregateRoot
{
    public FloorPlan FloorPlan { get; }
    public FloorPlanAggregate(FloorPlan floorPlan)
    {
        FloorPlan = floorPlan;
        AddEvent(new FloorPlanCreatedEvent(floorPlan.Id));
    }
}
