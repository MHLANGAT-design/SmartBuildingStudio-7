// GatewayManagementService.Infrastructure/Persistence/Repositories/GatewayAssignmentRepository.cs

using GatewayManagementService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GatewayManagementService.Infrastructure.Persistence.Repositories;

public sealed class GatewayAssignmentRepository
{
    private readonly GatewayManagementDbContext _context;

    public GatewayAssignmentRepository(GatewayManagementDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<GatewayAssignment>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _context.GatewayAssignments
            .Where(a => a.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }
}