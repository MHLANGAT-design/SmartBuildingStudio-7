// GatewayManagementService.Application/Interfaces/IGatewayAuditService.cs

namespace GatewayManagementService.Application.Interfaces;

public interface IGatewayAuditService
{
    Task RecordAsync(
        Guid gatewayId,
        string action,
        string? detail,
        CancellationToken cancellationToken = default);
}