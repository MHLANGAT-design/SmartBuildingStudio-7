// Persistence/Repositories/DiscoverySessionRepository.cs

using DeviceDiscoveryService.Domain.Aggregates;
using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.Repositories;
using DeviceDiscoveryService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DeviceDiscoveryService.Infrastructure.Persistence.Repositories;

public sealed class DiscoverySessionRepository : IDiscoverySessionRepository
{
    private readonly DeviceDiscoveryDbContext _db;

    public DiscoverySessionRepository(DeviceDiscoveryDbContext db) => _db = db;

    public Task<DiscoverySession?> GetByIdAsync(
        DiscoverySessionId id,
        CancellationToken cancellationToken = default)
    {
        return _db.DiscoverySessions
            .Include(s => s.Devices).ThenInclude(d => d.Identification)
            .Include(s => s.Devices).ThenInclude(d => d.Match)
            .Include(s => s.History)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public Task<DiscoverySession?> GetAggregateRootByIdAsync(
        DiscoverySessionId id,
        CancellationToken cancellationToken = default)
    {
        return _db.DiscoverySessions
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<DiscoverySession>> GetByProjectAsync(
        Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _db.DiscoverySessions
            .Where(s => s.ProjectId == projectId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DiscoverySession>> GetByFloorAsync(
        Guid projectId, Guid floorId, CancellationToken cancellationToken = default)
    {
        return await _db.DiscoverySessions
            .Where(s => s.ProjectId == projectId && s.FloorId == floorId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DiscoverySession>> GetRecentAsync(
        int take, CancellationToken cancellationToken = default)
    {
        return await _db.DiscoverySessions
            .OrderByDescending(s => s.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(DiscoverySession session, CancellationToken cancellationToken = default)
    {
        await _db.DiscoverySessions.AddAsync(session, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(DiscoverySession session, CancellationToken cancellationToken = default)
    {
        // DiscoveryHistoryEntry objects added to an already-tracked session
        // are wrongly marked 'Modified' because they have a Guid PK set at
        // creation. EF issues UPDATE ... WHERE Id = @new-guid, hitting 0 rows,
        // and throws DbUpdateConcurrencyException. History entries are
        // immutable audit rows — once saved they're never updated — so any
        // 'Modified' state means "new entity added during this request".
        // Re-tag as Added so EF issues INSERT.
        foreach (var historyEntry in session.History)
        {
            var entry = _db.Entry(historyEntry);
            if (entry.State == EntityState.Modified)
                entry.State = EntityState.Added;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}