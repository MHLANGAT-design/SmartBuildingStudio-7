// GatewayManagementService.Application/Commands/RunGatewayDiagnostics/RunGatewayDiagnosticsCommand.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Commands.RunGatewayDiagnostics;

public sealed record RunGatewayDiagnosticsCommand(Guid GatewayId) : IRequest<GatewayDiagnosticsDto>;