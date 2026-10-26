// FloorPlanService.Application/Projects/Commands/CreateBuildingCommand.cs

using MediatR;
using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Interfaces;
using System;

namespace FloorPlanService.Application.Projects.Commands;

public class CreateBuildingCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? ProjectId { get; set; }
    public string? ProjectName { get; set; }
}

public class CreateBuildingCommandHandler : IRequestHandler<CreateBuildingCommand, Guid>
{
    private readonly IFloorPlanRepository _repository;

    public CreateBuildingCommandHandler(IFloorPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(CreateBuildingCommand request, CancellationToken cancellationToken)
    {
        var building = new Building(request.Name, request.ProjectId);

        if (!string.IsNullOrWhiteSpace(request.ProjectName))
        {
            building.ProjectName = request.ProjectName;
        }

        await _repository.AddBuildingAsync(building, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return building.Id;
    }
}