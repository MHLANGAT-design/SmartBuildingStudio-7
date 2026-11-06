// GatewayManagementService.Application/Commands/ConfigureGateway/ConfigureGatewayCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.ConfigureGateway;

public sealed record ConfigureGatewayCommand(
    Guid GatewayId,
    int DaliLineCount,
    int PollingIntervalSeconds,
    int CommandTimeoutSeconds,
    string? AuthToken) : IRequest<GatewayDto>;