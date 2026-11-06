// GatewayManagementService.Application/DTOs/GatewayEventDto.cs

namespace GatewayManagementService.Application.DTOs;

public sealed class GatewayEventDto
{
    public Guid Id { get; set; }
    public Guid GatewayId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? Payload { get; set; }
    public DateTime OccurredAt { get; set; }
}