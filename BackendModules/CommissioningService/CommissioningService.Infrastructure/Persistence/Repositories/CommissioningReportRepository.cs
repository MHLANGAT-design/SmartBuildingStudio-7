using System.Threading.Tasks;
using CommissioningService.Infrastructure.Persistence;

namespace CommissioningService.Infrastructure.Persistence.Repositories;

public class CommissioningReportRepository
{
    private readonly CommissioningDbContext _context;
    public CommissioningReportRepository(CommissioningDbContext context) => _context = context;
    
    // Custom method to save report
}