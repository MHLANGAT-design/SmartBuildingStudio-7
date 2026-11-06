// GatewayManagementService.Application/Commands/RegisterGateway/RegisterGatewayCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.RegisterGateway;

public sealed record RegisterGatewayCommand(
    string Name,
    string Identifier,
    string Transport,
    string DaliProtocol,
    string EndpointHost,
    int EndpointPort,
    string? EndpointPath,
    int DaliLineCount,
    int PollingIntervalSeconds,
    int CommandTimeoutSeconds,
    string? AuthToken) : IRequest<GatewayDto>;