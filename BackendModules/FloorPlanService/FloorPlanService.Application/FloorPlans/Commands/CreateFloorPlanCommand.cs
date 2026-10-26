// FloorPlanService.Application/FloorPlans/Commands/CreateFloorPlanCommand.cs

using MediatR;
using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Interfaces;  // ← ADD THIS
using System;

namespace FloorPlanService.Application.FloorPlans.Commands;

public class CreateFloorPlanCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? ActiveProjectId { get; set; }
}

public class CreateFloorPlanCommandHandler : IRequestHandler<CreateFloorPlanCommand, Guid>
{
    private readonly IFloorPlanRepository _repository;

    public CreateFloorPlanCommandHandler(IFloorPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(CreateFloorPlanCommand request, CancellationToken cancellationToken)
    {
        var floorPlan = new FloorPlan(
            request.Name,
            request.ActiveProjectId
        );

        await _repository.AddAsync(floorPlan, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return floorPlan.Id;
    }
}