// FloorPlanService.Infrastructure/Repositories/FloorPlanRepository.cs

using FloorPlanService.Domain.Entities;
using FloorPlanService.Domain.Interfaces;
using FloorPlanService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FloorPlanService.Infrastructure.Repositories;

public class FloorPlanRepository : IFloorPlanRepository
{
    private readonly FloorPlanDbContext _context;

    public FloorPlanRepository(FloorPlanDbContext context)
    {
        _context = context;
    }

    public async Task<FloorPlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.FloorPlans
            .Include(f => f.Floors)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<FloorPlan>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.FloorPlans
            .Include(f => f.Floors)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(FloorPlan floorPlan, CancellationToken cancellationToken = default)
    {
        await _context.FloorPlans.AddAsync(floorPlan, cancellationToken);
    }

    public Task UpdateAsync(FloorPlan floorPlan, CancellationToken cancellationToken = default)
    {
        _context.FloorPlans.Update(floorPlan);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var floorPlan = await GetByIdAsync(id, cancellationToken);
        if (floorPlan != null)
        {
            _context.FloorPlans.Remove(floorPlan);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<FloorPlan?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _context.FloorPlans
            .FirstOrDefaultAsync(f => f.Name == name, cancellationToken);
    }

    public async Task AddBuildingAsync(Building building, CancellationToken cancellationToken = default)
    {
        await _context.Buildings.AddAsync(building, cancellationToken);
    }

    public async Task<Building?> GetBuildingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Buildings
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }
}