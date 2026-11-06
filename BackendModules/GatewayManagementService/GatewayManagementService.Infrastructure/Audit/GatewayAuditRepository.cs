// GatewayManagementService.Infrastructure/Audit/GatewayAuditRepository.cs

using GatewayManagementService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GatewayManagementService.Infrastructure.Audit;

public sealed class GatewayAuditRepository
{
    private readonly GatewayManagementDbContext _context;

    public GatewayAuditRepository(GatewayManagementDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(GatewayAuditEntry entry, CancellationToken cancellationToken = default)
    {
        // Audit entries are appended to the GatewayEvents table as a special event type.
        await _context.Database.ExecuteSqlRawAsync(
            "INSERT INTO GatewayAuditEntries (Id, GatewayId, Action, Detail, OccurredAt) VALUES ({0}, {1}, {2}, {3}, {4})",
            new object[] { entry.Id, entry.GatewayId, entry.Action, (object?)entry.Detail ?? DBNull.Value, entry.OccurredAt },
            cancellationToken);
    }
}