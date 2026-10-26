using MediatR;
using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Interfaces;

namespace FloorPlanService.Application.Projects.Queries;

public class GetProjectsQuery : IRequest<List<FloorPlan>>
{
}

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, List<FloorPlan>>
{
    private readonly IFloorPlanRepository _repository;

    public GetProjectsQueryHandler(IFloorPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<FloorPlan>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        // The repository method must be updated or targeted to eagerly load your entity layers
        var floorPlans = await _repository.GetAllAsync(cancellationToken);
        return floorPlans.ToList();
    }
}
