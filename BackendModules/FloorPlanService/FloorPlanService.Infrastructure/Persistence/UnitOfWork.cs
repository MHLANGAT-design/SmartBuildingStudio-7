using FloorPlanService.Domain.Interfaces;
namespace FloorPlanService.Infrastructure.Persistence;

public sealed class UnitOfWork : IFloorPlanUnitOfWork
{
    private readonly FloorPlanDbContext _context;
    private bool _disposed;

    public UnitOfWork(FloorPlanDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    private void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _context.Dispose();
            }
            _disposed = true;
        }
    }
}
