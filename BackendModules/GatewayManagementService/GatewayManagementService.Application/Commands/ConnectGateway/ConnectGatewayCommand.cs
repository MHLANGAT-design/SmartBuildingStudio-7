// GatewayManagementService.Application/Commands/ConnectGateway/ConnectGatewayCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.ConnectGateway;

public sealed record ConnectGatewayCommand(Guid GatewayId) : IRequest<GatewayDto>;