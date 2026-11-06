// GatewayManagementService.Application/Queries/GetGatewayOperations/GetGatewayOperationsQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayOperations;

public sealed record GetGatewayOperationsQuery(Guid GatewayId) : IRequest<IReadOnlyList<GatewayOperationDto>>;