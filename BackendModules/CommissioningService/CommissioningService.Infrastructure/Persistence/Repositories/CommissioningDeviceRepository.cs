using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CommissioningService.Domain.Entities;
using CommissioningService.Infrastructure.Persistence;

namespace CommissioningService.Infrastructure.Persistence.Repositories;

public class CommissioningDeviceRepository
{
    private readonly CommissioningDbContext _context;
    public CommissioningDeviceRepository(CommissioningDbContext context) => _context = context;

    public async Task AddAsync(CommissioningDevice device)
    {
        await _context.Devices.AddAsync(device);
        await _context.SaveChangesAsync();
    }
}