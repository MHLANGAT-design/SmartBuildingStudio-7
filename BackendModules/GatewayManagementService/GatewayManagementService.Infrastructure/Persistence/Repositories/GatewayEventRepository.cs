// GatewayManagementService.Infrastructure/Persistence/Repositories/GatewayEventRepository.cs

using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GatewayManagementService.Infrastructure.Persistence.Repositories;

public sealed class GatewayEventRepository
{
    private readonly GatewayManagementDbContext _context;

    public GatewayEventRepository(GatewayManagementDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<GatewayEvent>> GetRecentAsync(int take, CancellationToken cancellationToken = default)
    {
        return await _context.GatewayEvents
            .OrderByDescending(e => e.OccurredAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }
}