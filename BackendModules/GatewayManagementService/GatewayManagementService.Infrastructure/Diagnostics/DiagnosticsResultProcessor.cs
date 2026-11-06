// GatewayManagementService.Infrastructure/Diagnostics/DiagnosticsResultProcessor.cs

using GatewayManagementService.Application.DTOs;

namespace GatewayManagementService.Infrastructure.Diagnostics;

public sealed class DiagnosticsResultProcessor
{
    public string Summarize(GatewayDiagnosticsDto diagnostics)
    {
        if (diagnostics.IsHealthy)
            return $"Healthy — {diagnostics.LatencyMs} ms.";

        return diagnostics.ErrorMessage ?? "Unhealthy.";
    }
}