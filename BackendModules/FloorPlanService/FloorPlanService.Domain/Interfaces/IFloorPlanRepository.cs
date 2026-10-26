// FloorPlanService.Domain/Interfaces/IFloorPlanRepository.cs

using FloorPlanService.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace FloorPlanService.Domain.Interfaces;

public interface IFloorPlanRepository : IRepository<FloorPlan>
{
    Task<FloorPlan?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task AddBuildingAsync(Building building, CancellationToken cancellationToken = default);
    Task<Building?> GetBuildingByIdAsync(Guid id, CancellationToken cancellationToken = default);
}