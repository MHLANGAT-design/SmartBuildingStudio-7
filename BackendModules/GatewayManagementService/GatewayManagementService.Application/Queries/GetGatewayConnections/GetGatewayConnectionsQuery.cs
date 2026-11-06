// GatewayManagementService.Application/Queries/GetGatewayConnections/GetGatewayConnectionsQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayConnections;

public sealed record GetGatewayConnectionsQuery(Guid GatewayId) : IRequest<IReadOnlyList<GatewayConnectionDto>>;