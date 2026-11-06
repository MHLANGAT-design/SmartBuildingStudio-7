// GatewayManagementService.Application/DTOs/GatewayConnectionDto.cs

namespace GatewayManagementService.Application.DTOs;

public sealed class GatewayConnectionDto
{
    public Guid Id { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime? DisconnectedAt { get; set; }
    public string? DisconnectReason { get; set; }
    public string? RemoteEndpoint { get; set; }
    public bool IsOpen { get; set; }
}