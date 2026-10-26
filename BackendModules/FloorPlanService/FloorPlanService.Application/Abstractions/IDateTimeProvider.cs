namespace FloorPlanService.Application.Abstractions;
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
