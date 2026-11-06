// GatewayManagementService.Infrastructure/Audit/GatewayAuditService.cs

using GatewayManagementService.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace GatewayManagementService.Infrastructure.Audit;

public sealed class GatewayAuditService : IGatewayAuditService
{
    private readonly GatewayAuditRepository _repository;
    private readonly ILogger<GatewayAuditService> _logger;

    public GatewayAuditService(GatewayAuditRepository repository, ILogger<GatewayAuditService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task RecordAsync(Guid gatewayId, string action, string? detail, CancellationToken cancellationToken = default)
    {
        var entry = new GatewayAuditEntry
        {
            GatewayId = gatewayId,
            Action = action,
            Detail = detail
        };

        try
        {
            await _repository.AddAsync(entry, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist audit entry for gateway {GatewayId}: {Action}", gatewayId, action);
        }
    }
}