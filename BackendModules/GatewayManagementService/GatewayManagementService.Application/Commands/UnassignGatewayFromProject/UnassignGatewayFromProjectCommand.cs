// GatewayManagementService.Application/Commands/UnassignGatewayFromProject/UnassignGatewayFromProjectCommand.cs

using MediatR;

namespace GatewayManagementService.Application.Commands.UnassignGatewayFromProject;

public sealed record UnassignGatewayFromProjectCommand(Guid GatewayId, Guid AssignmentId) : IRequest<Unit>;