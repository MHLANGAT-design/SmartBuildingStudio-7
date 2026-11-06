// GatewayManagementService.Application/Mapping/GatewayAssignmentMapping.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Domain.Entities;

namespace GatewayManagementService.Application.Mapping;

public static class GatewayAssignmentMapping
{
    public static GatewayAssignmentDto ToDto(this GatewayAssignment assignment, Guid gatewayId)
    {
        return new GatewayAssignmentDto
        {
            Id = assignment.Id,
            GatewayId = gatewayId,
            ProjectId = assignment.ProjectId,
            FloorId = assignment.FloorId,
            DaliNetworkId = assignment.DaliNetworkId,
            AssignedAt = assignment.AssignedAt
        };
    }
}