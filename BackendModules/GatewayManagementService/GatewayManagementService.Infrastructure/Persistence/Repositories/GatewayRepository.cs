// GatewayManagementService.Infrastructure/Persistence/Repositories/GatewayRepository.cs

using GatewayManagementService.Domain.Aggregates;
using GatewayManagementService.Domain.Repositories;
using GatewayManagementService.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace GatewayManagementService.Infrastructure.Persistence.Repositories;

public sealed class GatewayRepository : IGatewayRepository
{
    private readonly GatewayManagementDbContext _context;

    public GatewayRepository(GatewayManagementDbContext context)
    {
        _context = context;
    }

    public async Task<Gateway?> GetByIdAsync(GatewayId id, CancellationToken cancellationToken = default)
    {
        return await _context.Gateways
            .Include(g => g.Operations)
            .Include(g => g.Events)
            .Include(g => g.ConnectionHistory)
            .Include(g => g.Assignments)
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Gateway>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Gateways
            .Include(g => g.Operations)
            .Include(g => g.Events)
            .Include(g => g.ConnectionHistory)
            .Include(g => g.Assignments)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Gateway>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _context.Gateways
            .Include(g => g.Operations)
            .Include(g => g.Events)
            .Include(g => g.ConnectionHistory)
            .Include(g => g.Assignments)
            .Where(g => g.Assignments.Any(a => a.ProjectId == projectId))
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Gateway gateway, CancellationToken cancellationToken = default)
    {
        await _context.Gateways.AddAsync(gateway, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Gateway gateway, CancellationToken cancellationToken = default)
    {
        _context.Gateways.Update(gateway);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(GatewayId id, CancellationToken cancellationToken = default)
    {
        var gateway = await _context.Gateways.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
        if (gateway != null)
        {
            _context.Gateways.Remove(gateway);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}