namespace FloorPlanService.Domain.Interfaces;
public interface IFloorPlanUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
