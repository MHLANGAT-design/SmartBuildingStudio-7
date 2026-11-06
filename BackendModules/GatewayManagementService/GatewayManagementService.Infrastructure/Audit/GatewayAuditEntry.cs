// GatewayManagementService.Infrastructure/Audit/GatewayAuditEntry.cs

namespace GatewayManagementService.Infrastructure.Audit;

public sealed class GatewayAuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GatewayId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}