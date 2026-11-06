// GatewayManagementService.Application/Commands/AssignGatewayToProject/AssignGatewayToProjectCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.AssignGatewayToProject;

public sealed record AssignGatewayToProjectCommand(
    Guid GatewayId,
    Guid ProjectId,
    Guid? FloorId,
    Guid? DaliNetworkId) : IRequest<GatewayAssignmentDto>;