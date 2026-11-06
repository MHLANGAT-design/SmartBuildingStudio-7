// GatewayManagementService.Application/DTOs/GatewayStatusDto.cs

namespace GatewayManagementService.Application.DTOs;

public sealed class GatewayStatusDto
{
    public Guid GatewayId { get; set; }
    public string ConnectionStatus { get; set; } = string.Empty;
    public DateTime? LastConnectedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public string? LastErrorMessage { get; set; }
    public bool IsReachable { get; set; }
}