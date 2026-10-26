// FloorPlanService.Application/Projects/Commands/CreateProjectCommand.cs

using MediatR;
using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Interfaces;  // ← ADD THIS
using System;

namespace FloorPlanService.Application.Projects.Commands;

public class CreateProjectCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? ClientName { get; set; }
    public string? ActiveProjectId { get; set; }
    public string? ActiveProjectName { get; set; }
}

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, Guid>
{
    private readonly IFloorPlanRepository _repository;  // Now resolves

    public CreateProjectCommandHandler(IFloorPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var floorPlan = new FloorPlan(
            request.Name,
            request.ActiveProjectId
        );

        if (!string.IsNullOrWhiteSpace(request.ClientName))
        {
            floorPlan.UpdateClientName(request.ClientName);
        }

        await _repository.AddAsync(floorPlan, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return floorPlan.Id;
    }
}