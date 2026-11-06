// GatewayManagementService.Api/Contracts/Responses/GatewayAssignmentResponse.cs

namespace GatewayManagementService.Api.Contracts.Responses;

public sealed class GatewayAssignmentResponse
{
    public Guid Id { get; set; }
    public Guid GatewayId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? FloorId { get; set; }
    public Guid? DaliNetworkId { get; set; }
    public DateTime AssignedAt { get; set; }
}