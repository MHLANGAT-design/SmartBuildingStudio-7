// GatewayManagementService.Application/Commands/ReconnectGateway/ReconnectGatewayCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.ReconnectGateway;

public sealed record ReconnectGatewayCommand(Guid GatewayId) : IRequest<GatewayDto>;