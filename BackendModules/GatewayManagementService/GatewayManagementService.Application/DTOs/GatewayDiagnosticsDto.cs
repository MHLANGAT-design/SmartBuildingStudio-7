// GatewayManagementService.Application/DTOs/GatewayDiagnosticsDto.cs

namespace GatewayManagementService.Application.DTOs;

public sealed class GatewayDiagnosticsDto
{
    public Guid GatewayId { get; set; }
    public bool IsHealthy { get; set; }
    public int LatencyMs { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CheckedAt { get; set; }
    public List<GatewayDiagnosticCheckDto> Checks { get; set; } = new();
}

public sealed class GatewayDiagnosticCheckDto
{
    public string Name { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public int LatencyMs { get; set; }
    public string? Detail { get; set; }
}