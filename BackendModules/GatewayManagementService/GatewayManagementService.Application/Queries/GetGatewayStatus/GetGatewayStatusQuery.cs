// GatewayManagementService.Application/Queries/GetGatewayStatus/GetGatewayStatusQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayStatus;

public sealed record GetGatewayStatusQuery(Guid GatewayId) : IRequest<GatewayStatusDto?>;