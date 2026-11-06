// GatewayManagementService.Application/Queries/GetGatewayDiagnostics/GetGatewayDiagnosticsQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayDiagnostics;

public sealed record GetGatewayDiagnosticsQuery(Guid GatewayId) : IRequest<GatewayDiagnosticsDto>;