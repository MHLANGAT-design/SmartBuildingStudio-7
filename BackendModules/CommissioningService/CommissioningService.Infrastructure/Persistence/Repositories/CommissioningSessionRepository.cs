using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Infrastructure.Persistence.Repositories;

public class CommissioningSessionRepository : ICommissioningSessionRepository
{
    private readonly CommissioningDbContext _context;

    public CommissioningSessionRepository(CommissioningDbContext context)
    {
        _context = context;
    }

    public async Task<CommissioningSession?> GetByIdAsync(CommissioningSessionId id)
    {
        return await _context.Sessions
            .Include(s => s.Devices)
            .Include(s => s.Defects)
            .Include(s => s.Tests)
            .Include(s => s.NetworkStates)
            .Include(s => s.AddressAssignments)
            .FirstOrDefaultAsync(s => s.Id == id); // Now EF Core can translate this!
    }

    public async Task AddAsync(CommissioningSession session)
    {
        await _context.Sessions.AddAsync(session);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(CommissioningSession session)
    {
        _context.Sessions.Update(session);
        await _context.SaveChangesAsync();
    }
}