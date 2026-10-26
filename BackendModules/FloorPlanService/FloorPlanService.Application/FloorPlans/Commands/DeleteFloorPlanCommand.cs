using MediatR;
namespace FloorPlanService.Application.FloorPlans.Commands;
public sealed record DeleteFloorPlanCommand(Guid FloorPlanId) : IRequest;
