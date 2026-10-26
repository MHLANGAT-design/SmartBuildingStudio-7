using Microsoft.EntityFrameworkCore;
using ProjectExplorerService.Domain.Aggregates.ProjectAggregate;
using ProjectExplorerService.Domain.RepositoryContracts;

namespace ProjectExplorerService.Infrastructure.Persistence.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly ProjectExplorerDbContext _context;

    public ProjectRepository(ProjectExplorerDbContext context)
    {
        _context = context;
    }

    public async Task<Project?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .Include(p => p.Buildings)
                .ThenInclude(b => b.Floors)
                    .ThenInclude(f => f.Documents)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Project>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Projects
            .Include(p => p.Buildings)
                .ThenInclude(b => b.Floors)
                    .ThenInclude(f => f.Documents)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Project project, CancellationToken cancellationToken = default)
    {
        await _context.Projects.AddAsync(project, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Project project, CancellationToken cancellationToken = default)
    {
        _context.Projects.Remove(project);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
