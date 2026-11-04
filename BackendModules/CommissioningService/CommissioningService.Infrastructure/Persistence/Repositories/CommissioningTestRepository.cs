using System.Threading.Tasks;
using CommissioningService.Domain.Entities;
using CommissioningService.Infrastructure.Persistence;

namespace CommissioningService.Infrastructure.Persistence.Repositories;

public class CommissioningTestRepository
{
    private readonly CommissioningDbContext _context;
    public CommissioningTestRepository(CommissioningDbContext context) => _context = context;

    public async Task AddAsync(CommissioningTest test)
    {
        await _context.Tests.AddAsync(test);
        await _context.SaveChangesAsync();
    }
}