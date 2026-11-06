// GatewayManagementService.Application/Queries/GetGatewayAssignments/GetGatewayAssignmentsQuery.cs

using GatewayManagementService.Application.DTOs;
using MediatR;

namespace GatewayManagementService.Application.Queries.GetGatewayAssignments;

public sealed record GetGatewayAssignmentsQuery(Guid GatewayId) : IRequest<IReadOnlyList<GatewayAssignmentDto>>;