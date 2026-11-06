// GatewayManagementService.Application/Queries/GetGateway/GetGatewayQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGateway;

public sealed record GetGatewayQuery(Guid GatewayId) : IRequest<GatewayDto?>;