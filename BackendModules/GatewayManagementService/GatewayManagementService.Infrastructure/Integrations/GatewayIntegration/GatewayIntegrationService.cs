// GatewayManagementService.Infrastructure/Integrations/GatewayIntegration/GatewayIntegrationService.cs

using GatewayManagementService.Application.DTOs;
using GatewayManagementService.Application.Interfaces;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;

namespace GatewayManagementService.Infrastructure.Integrations.GatewayIntegration;

public sealed class GatewayIntegrationService : IGatewayIntegrationService
{
    private readonly IGatewayRepository _repository;
    private readonly GatewayIntegrationManager _manager;

    public GatewayIntegrationService(IGatewayRepository repository, GatewayIntegrationManager manager)
    {
        _repository = repository;
        _manager = manager;
    }

    public async Task<bool> PingAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(gatewayId), cancellationToken);
        if (gateway == null) return false;

        var provider = _manager.Resolve(gateway.Transport.Value.ToString());
        return await provider.PingAsync(gateway.Endpoint.ToString(), cancellationToken);
    }

    public async Task<GatewayDiagnosticsDto> RunDiagnosticsAsync(Guid gatewayId, CancellationToken cancellationToken = default)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(gatewayId), cancellationToken);
        if (gateway == null)
        {
            return new GatewayDiagnosticsDto { GatewayId = gatewayId, IsHealthy = false, ErrorMessage = "Not found." };
        }

        var provider = _manager.Resolve(gateway.Transport.Value.ToString());
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var ok = await provider.PingAsync(gateway.Endpoint.ToString(), cancellationToken);
        sw.Stop();

        return new GatewayDiagnosticsDto
        {
            GatewayId = gatewayId,
            IsHealthy = ok,
            LatencyMs = (int)sw.ElapsedMilliseconds,
            CheckedAt = DateTime.UtcNow,
            Checks =
            {
                new GatewayDiagnosticCheckDto
                {
                    Name = "Ping",
                    Passed = ok,
                    LatencyMs = (int)sw.ElapsedMilliseconds
                }
            }
        };
    }

    public async Task<string> ExecuteOperationAsync(Guid gatewayId, string operationType, string? payload, CancellationToken cancellationToken = default)
    {
        var gateway = await _repository.GetByIdAsync(new GatewayId(gatewayId), cancellationToken)
            ?? throw new InvalidOperationException($"Gateway '{gatewayId}' not found.");

        var provider = _manager.Resolve(gateway.Transport.Value.ToString());
        return await provider.SendAsync(gateway.Endpoint.ToString(), payload ?? string.Empty, cancellationToken);
    }
}