using Microsoft.EntityFrameworkCore;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.Repositories;
using ProductCatalogService.Infrastructure.Persistence;

namespace ProductCatalogService.Infrastructure.Repositories;

public sealed class ProductCategoryRepository : IProductCategoryRepository
{
    private readonly ProductCatalogDbContext _db;

    public ProductCategoryRepository(ProductCatalogDbContext db)
    {
        _db = db;
    }

    public async Task<ProductCategory?> GetByIdAsync(Guid id)
    {
        return await _db.Categories.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task AddAsync(ProductCategory category)
    {
        await _db.Categories.AddAsync(category);
        await _db.SaveChangesAsync();
    }
}