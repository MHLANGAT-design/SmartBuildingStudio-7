// FloorPlanService.Application/FloorPlans/Commands/AddFloorCommand.cs

using MediatR;
using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Interfaces;  // ← ADD THIS
using System;

namespace FloorPlanService.Application.FloorPlans.Commands;

public class AddFloorCommand : IRequest<Guid>
{
    public Guid FloorPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int LevelIndex { get; set; }
    public double ElevationHeightMeters { get; set; } = 3.0;
}

public class AddFloorCommandHandler : IRequestHandler<AddFloorCommand, Guid>
{
    private readonly IFloorPlanRepository _repository;

    public AddFloorCommandHandler(IFloorPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<Guid> Handle(AddFloorCommand request, CancellationToken cancellationToken)
    {
        var floorPlan = await _repository.GetByIdAsync(request.FloorPlanId, cancellationToken);
        
        if (floorPlan == null)
        {
            throw new Exception($"FloorPlan with ID {request.FloorPlanId} not found.");
        }

        var floor = new Floor(
            request.Name,
            request.LevelIndex,
            request.ElevationHeightMeters
        );

        floorPlan.Floors.Add(floor);
        await _repository.SaveChangesAsync(cancellationToken);

        return floor.Id;
    }
}