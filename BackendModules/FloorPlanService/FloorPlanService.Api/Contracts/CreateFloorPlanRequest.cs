namespace FloorPlanService.API.Contracts;

public sealed class CreateFloorPlanRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
}
