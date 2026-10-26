using Microsoft.EntityFrameworkCore;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.Repositories;
using ProductCatalogService.Infrastructure.Persistence;

namespace ProductCatalogService.Infrastructure.Repositories;

public sealed class ManufacturerRepository : IManufacturerRepository
{
    private readonly ProductCatalogDbContext _db;

    public ManufacturerRepository(ProductCatalogDbContext db)
    {
        _db = db;
    }

    public async Task<Manufacturer?> GetByIdAsync(Guid id)
    {
        return await _db.Manufacturers.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task AddAsync(Manufacturer manufacturer)
    {
        await _db.Manufacturers.AddAsync(manufacturer);
        await _db.SaveChangesAsync();
    }
}