// FloorPlanService.Application/FloorPlans/Commands/UpdateFloorPlanCommand.cs

using MediatR;
using FloorPlanService.Domain.Interfaces;  // ← ADD THIS
using System;

namespace FloorPlanService.Application.FloorPlans.Commands;

public class UpdateFloorPlanCommand : IRequest<Unit>  // ← CHANGE to IRequest<Unit>
{
    public Guid FloorPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DrawnWallsJson { get; set; } = "{}";
    public string DefinedRoomsJson { get; set; } = "{}";
    public string PlacedFixturesJson { get; set; } = "{}";
    public double PixelsToMetresScale { get; set; } = 1.0;
}

public class UpdateFloorPlanCommandHandler : IRequestHandler<UpdateFloorPlanCommand, Unit>  // ← FIXED
{
    private readonly IFloorPlanRepository _repository;

    public UpdateFloorPlanCommandHandler(IFloorPlanRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(UpdateFloorPlanCommand request, CancellationToken cancellationToken)  // ← FIXED return type
    {
        var floorPlan = await _repository.GetByIdAsync(request.FloorPlanId, cancellationToken);
        
        if (floorPlan == null)
        {
            throw new Exception($"FloorPlan with ID {request.FloorPlanId} not found.");
        }

        floorPlan.UpdateFloorPlanData(
            request.DrawnWallsJson,
            request.DefinedRoomsJson,
            request.PlacedFixturesJson,
            request.PixelsToMetresScale
        );

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            floorPlan.Name = request.Name;
        }

        await _repository.SaveChangesAsync(cancellationToken);
        
        return Unit.Value;  // ← RETURN Unit.Value
    }
}