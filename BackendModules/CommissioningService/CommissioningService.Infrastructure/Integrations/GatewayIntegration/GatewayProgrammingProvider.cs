// CommissioningService.Infrastructure\Integrations\GatewayIntegration\GatewayProgrammingProvider.cs

using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CommissioningService.Application.Interfaces;
using CommissioningService.Application.Commands.DeployProgramming;
using CommissioningService.Infrastructure.Configuration;

namespace CommissioningService.Infrastructure.Integrations.GatewayIntegration;

public class GatewayProgrammingProvider : IGatewayProgrammingProvider
{
    private readonly GatewayManagementClient _client;
    private readonly CommissioningInfrastructureOptions _options;
    private readonly ILogger<GatewayProgrammingProvider> _logger;

    public GatewayProgrammingProvider(
        GatewayManagementClient client,
        IOptions<CommissioningInfrastructureOptions> options,
        ILogger<GatewayProgrammingProvider> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<DeployProgrammingResult> DeployPlanAsync(
        string gatewayId,
        string targetLineId,
        string deploymentId,
        List<ProgrammingSequence> sequences,
        CancellationToken cancellationToken = default)
    {
        // ── 1. MOCK PATH (No physical gateway) ──────────────────────────
        if (_options.UseMockIntegrations)
        {
            int total = 0;
            foreach (var seq in sequences)
                total += seq.Commands.Count;

            _logger.LogInformation(
                "MOCK DEPLOY: Simulating {Count} commands for deployment {DeploymentId} (No physical gateway).",
                total, deploymentId);

            await Task.Delay(300, cancellationToken);

            return new DeployProgrammingResult(
                DeploymentId: deploymentId,
                Success: true,
                CommandsSent: total,
                CommandsFailed: 0,
                ErrorMessage: null
            );
        }

        // ── 2. REAL PATH (Physical gateway required) ────────────────────
        int sent = 0;
        int failed = 0;

        foreach (var sequence in sequences)
        {
            foreach (var command in sequence.Commands)
            {
                try
                {
                    await _client.SendCommandAsync(
                        gatewayId,
                        $"{command.CommandType}|{sequence.Address}|{command.Parameter1}|{command.Parameter2}",
                        cancellationToken);
                    sent++;
                }
                catch (System.Exception ex)
                {
                    failed++;
                    _logger.LogWarning(ex,
                        "Command {CommandType} on device {DeviceId} at address {Address} failed",
                        command.CommandType, sequence.DeviceId, sequence.Address);
                }
            }
        }

        return new DeployProgrammingResult(
            DeploymentId: deploymentId,
            Success: failed == 0,
            CommandsSent: sent,
            CommandsFailed: failed,
            ErrorMessage: failed > 0 ? $"{failed} command(s) failed" : null
        );
    }
}