// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayIntegrationHealthMonitor.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Infrastructure.Integrations.GatewayIntegration.GatewayCommunication;

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration;

public sealed class GatewayIntegrationHealthMonitor : IGatewayDiagnosticsProvider
{
    private readonly IGatewayIntegrationService _integrationService;
    private readonly GatewayIntegrationConfiguration _config;

    public GatewayIntegrationHealthMonitor(
        IGatewayIntegrationService integrationService,
        GatewayIntegrationConfiguration config)
    {
        _integrationService = integrationService;
        _config = config;
    }

    public async Task<GatewayDiagnosticsDto> RunAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        var diagnostics = new GatewayDiagnosticsDto
        {
            GatewayId = gatewayId,
            CheckedAt = DateTime.UtcNow
        };

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var pingOk = await _integrationService.PingAsync(gatewayId, cancellationToken);
        sw.Stop();

        diagnostics.LatencyMs = (int)sw.ElapsedMilliseconds;
        diagnostics.IsHealthy = pingOk;
        diagnostics.Checks.Add(new GatewayDiagnosticCheckDto
        {
            Name = "Ping",
            Passed = pingOk,
            LatencyMs = (int)sw.ElapsedMilliseconds,
            Detail = pingOk ? null : "Gateway did not respond to ping."
        });

        if (!pingOk)
        {
            diagnostics.ErrorMessage = "Ping failed.";
            return diagnostics;
        }

        return diagnostics;
    }
}