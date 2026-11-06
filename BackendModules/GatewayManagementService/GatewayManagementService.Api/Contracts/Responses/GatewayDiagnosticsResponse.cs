// GatewayManagementService.Api/Contracts/Responses/GatewayDiagnosticsResponse.cs

namespace GatewayManagementService.Api.Contracts.Responses;

public sealed class GatewayDiagnosticsResponse
{
    public Guid GatewayId { get; set; }
    public bool IsHealthy { get; set; }
    public int LatencyMs { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CheckedAt { get; set; }
    public List<GatewayDiagnosticCheckResponse> Checks { get; set; } = new();
}

public sealed class GatewayDiagnosticCheckResponse
{
    public string Name { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public int LatencyMs { get; set; }
    public string? Detail { get; set; }
}