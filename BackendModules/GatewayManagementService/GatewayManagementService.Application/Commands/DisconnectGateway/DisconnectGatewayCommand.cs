// GatewayManagementService.Application/Commands/DisconnectGateway/DisconnectGatewayCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.DisconnectGateway;

public sealed record DisconnectGatewayCommand(Guid GatewayId, string? Reason) : IRequest<GatewayDto>;