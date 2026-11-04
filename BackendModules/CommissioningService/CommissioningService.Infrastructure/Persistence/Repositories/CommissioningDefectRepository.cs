using System.Threading.Tasks;
using CommissioningService.Domain.Entities;
using CommissioningService.Infrastructure.Persistence;

namespace CommissioningService.Infrastructure.Persistence.Repositories;

public class CommissioningDefectRepository
{
    private readonly CommissioningDbContext _context;
    public CommissioningDefectRepository(CommissioningDbContext context) => _context = context;

    public async Task AddAsync(CommissioningDefect defect)
    {
        await _context.Defects.AddAsync(defect);
        await _context.SaveChangesAsync();
    }
}