// GatewayManagementService.Application/Commands/ExecuteGatewayOperation/ExecuteGatewayOperationCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.ExecuteGatewayOperation;

public sealed record ExecuteGatewayOperationCommand(
    Guid GatewayId,
    string OperationType,
    string? Payload) : IRequest<GatewayOperationDto>;