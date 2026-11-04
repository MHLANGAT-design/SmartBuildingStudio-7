using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CommissioningService.Application.Interfaces;
using CommissioningService.Application.DTOs;
using CommissioningService.Infrastructure.Configuration;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewayDiagnosticsProvider : IProgrammingDiagnosticsProvider
{
    private readonly GatewayManagementClient _client;
    private readonly CommissioningInfrastructureOptions _options;
    private readonly ILogger<GatewayDiagnosticsProvider> _logger;

    public GatewayDiagnosticsProvider(
        GatewayManagementClient client,
        IOptions<CommissioningInfrastructureOptions> options,
        ILogger<GatewayDiagnosticsProvider> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<DiagnosticsReportDto> RunDiagnosticsAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken = default)
    {
        var report = new DiagnosticsReportDto
        {
            GatewayId = gatewayId,
            LineId = lineId,
            ExecutedAt = DateTime.UtcNow,
            IsHealthy = true,
            BusStats = new BusStatisticsDto(),
            Summary = new DiagnosticsSummaryDto(),
            DeviceStatuses = new(),
            GlobalIssues = new(),
        };

        if (_options.UseMockIntegrations)
        {
            _logger.LogInformation("MOCK DIAGNOSTICS: Simulating diagnostics on line {LineId}.", lineId);

            await Task.Delay(400, cancellationToken);

            report.BusStats.Successful = 100;
            report.BusStats.Failed = 0;
            report.BusStats.Timeouts = 0;
            report.BusStats.SuccessRatePercent = 100.0;
            report.Summary.TotalIssues = 0;
            report.IsHealthy = true;

            return report;
        }

        report.BusStats.SuccessRatePercent = 100.0;
        return report;
    }
}