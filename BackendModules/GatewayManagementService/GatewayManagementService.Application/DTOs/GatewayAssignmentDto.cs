// GatewayManagementService.Application/DTOs/GatewayAssignmentDto.cs

namespace GatewayManagementService.Application.DTOs;

public sealed class GatewayAssignmentDto
{
    public Guid Id { get; set; }
    public Guid GatewayId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? FloorId { get; set; }
    public Guid? DaliNetworkId { get; set; }
    public DateTime AssignedAt { get; set; }
}