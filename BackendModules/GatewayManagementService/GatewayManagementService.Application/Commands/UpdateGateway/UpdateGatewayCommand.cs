// GatewayManagementService.Application/Commands/UpdateGateway/UpdateGatewayCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.UpdateGateway;

public sealed record UpdateGatewayCommand(
    Guid GatewayId,
    string Name,
    string EndpointHost,
    int EndpointPort,
    string? EndpointPath) : IRequest<GatewayDto>;