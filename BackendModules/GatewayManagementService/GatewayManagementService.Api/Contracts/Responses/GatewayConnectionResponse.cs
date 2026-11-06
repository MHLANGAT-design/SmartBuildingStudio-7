// GatewayManagementService.Api/Contracts/Responses/GatewayConnectionResponse.cs

namespace GatewayManagementService.Api.Contracts.Responses;

public sealed class GatewayConnectionResponse
{
    public Guid Id { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime? DisconnectedAt { get; set; }
    public string? DisconnectReason { get; set; }
    public string? RemoteEndpoint { get; set; }
    public bool IsOpen { get; set; }
}