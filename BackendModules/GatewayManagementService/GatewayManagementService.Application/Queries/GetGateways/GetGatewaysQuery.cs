// GatewayManagementService.Application/Queries/GetGateways/GetGatewaysQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGateways;

public sealed record GetGatewaysQuery : IRequest<IReadOnlyList<GatewayDto>>;