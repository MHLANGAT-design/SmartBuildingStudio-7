// GatewayManagementService.Api/Contracts/Responses/GatewayStatusResponse.cs

namespace GatewayManagementService.Api.Contracts.Responses;

public sealed class GatewayStatusResponse
{
    public Guid GatewayId { get; set; }
    public string ConnectionStatus { get; set; } = string.Empty;
    public DateTime? LastConnectedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public string? LastErrorMessage { get; set; }
    public bool IsReachable { get; set; }
}