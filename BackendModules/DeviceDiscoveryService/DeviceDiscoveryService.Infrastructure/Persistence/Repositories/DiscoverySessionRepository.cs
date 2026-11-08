// Persistence/Repositories/DiscoverySessionRepository.cs

using DeviceDiscoveryService.Domain.Aggregates;
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
            .Include(s => s.Devices)
                .ThenInclude(d => d.Identification)
            .Include(s => s.Devices)
                .ThenInclude(d => d.Match)
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
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        return await _db.DiscoverySessions
            .Where(s => s.ProjectId == projectId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DiscoverySession>> GetByFloorAsync(
        Guid projectId,
        Guid floorId,
        CancellationToken cancellationToken = default)
    {
        return await _db.DiscoverySessions
            .Where(s => s.ProjectId == projectId && s.FloorId == floorId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DiscoverySession>> GetRecentAsync(
        int take,
        CancellationToken cancellationToken = default)
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
        // The session is already tracked if loaded via GetByIdAsync; SaveChanges
        // picks up all modifications (including child collection changes).
        _db.DiscoverySessions.Update(session);
        await _db.SaveChangesAsync(cancellationToken);
    }
}