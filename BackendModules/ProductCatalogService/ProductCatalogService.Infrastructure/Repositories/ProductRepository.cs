using Microsoft.EntityFrameworkCore;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.Repositories;
using ProductCatalogService.Infrastructure.Persistence;

namespace ProductCatalogService.Infrastructure.Repositories;

public sealed class ProductRepository : IProductRepository
{
    private readonly ProductCatalogDbContext _db;

    public ProductRepository(ProductCatalogDbContext db)
    {
        _db = db;
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _db.Products
            .Include(p => p.PhotometricFiles)
            .Include(p => p.Datasheets)
            .Include(p => p.Certifications)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task AddAsync(Product product)
    {
        await _db.Products.AddAsync(product);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Product product)
    {
        _db.Products.Update(product);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _db.Products.FindAsync(id);
        if (entity is null) return;
        _db.Products.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _db.SaveChangesAsync(cancellationToken);
    }

    public async Task TrackAsNewAsync(PhotometricFile file, CancellationToken cancellationToken = default)
    {
        await _db.Set<PhotometricFile>().AddAsync(file, cancellationToken);
    }
}