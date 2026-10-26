using Microsoft.EntityFrameworkCore;
using ProductCatalogService.Application.DTOs;
using ProductCatalogService.Application.Interfaces;
using ProductCatalogService.Application.Queries.Products;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Infrastructure.Persistence;

namespace ProductCatalogService.Infrastructure.ReadServices;

public sealed class ProductReadService : IProductReadService
{
    private readonly ProductCatalogDbContext _db;

    public ProductReadService(ProductCatalogDbContext db)
    {
        _db = db;
    }

    public async Task<ProductDto?> GetByIdAsync(Guid productId)
    {
        return await _db.Products
            .Where(x => x.Id == productId)
            .Select(Projection)
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyCollection<ProductDto>> FindAsync(
        ProductFilters? filters)
    {
        IQueryable<Product> q = _db.Products;

        if (filters is not null && !filters.IsEmpty)
        {
            if (!string.IsNullOrWhiteSpace(filters.Manufacturer))
            {
                var m = filters.Manufacturer.ToLower();
                q = q.Where(p => p.Manufacturer.ToLower() == m);
            }

            if (!string.IsNullOrWhiteSpace(filters.Family))
            {
                var f = filters.Family.ToLower();
                q = q.Where(p =>
                    p.Family != null && p.Family.ToLower() == f);
            }

            if (filters.ProductType.HasValue)
            {
                var type = filters.ProductType.Value;
                q = q.Where(p => (int)p.ProductType == type);
            }

            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                var pattern = $"%{filters.Search.Trim()}%";
                q = q.Where(p =>
                    EF.Functions.ILike(p.Name, pattern) ||
                    EF.Functions.ILike(p.ProductCode.Value, pattern) ||
                    EF.Functions.ILike(p.Manufacturer, pattern));
            }
        }

        return await q.Select(Projection).ToListAsync();
    }

    public async Task<IReadOnlyCollection<string>> GetDistinctManufacturersAsync()
    {
        return await _db.Products
            .Where(x => x.Manufacturer != null && x.Manufacturer != "")
            .Select(x => x.Manufacturer)
            .Distinct()
            .OrderBy(m => m)
            .ToListAsync();
    }

    public async Task<IReadOnlyCollection<string>> GetDistinctFamiliesAsync()
    {
        return await _db.Products
            .Where(x => x.Family != null && x.Family != "")
            .Select(x => x.Family!)
            .Distinct()
            .OrderBy(f => f)
            .ToListAsync();
    }

    public async Task<IReadOnlyCollection<ManufacturerStatsDto>>
        GetManufacturerStatsAsync()
    {
        // Order BEFORE the projection. EF Core cannot translate an
        // OrderBy that references a property on the projected DTO —
        // it needs to order by the underlying group key (a plain
        // column) so the whole chain compiles to one SQL query.
        return await _db.Products
            .Where(x => x.Manufacturer != null && x.Manufacturer != "")
            .GroupBy(x => x.Manufacturer)
            .OrderBy(g => g.Key)
            .Select(g => new ManufacturerStatsDto(g.Key, g.Count()))
            .ToListAsync();
    }

    /// <summary>
    /// Shared projection from Product to ProductDto. EF Core can
    /// translate an expression tree (unlike a static method), so this
    /// is defined as an Expression and reused by every query method.
    /// </summary>
    private static System.Linq.Expressions.Expression<
        Func<Product, ProductDto>> Projection =>
        x => new ProductDto(
            x.Id,
            x.ProductCode.Value,
            x.Name,
            x.ProductType.ToString(),
            x.Specification.Wattage,
            x.Specification.Lumens,
            x.Specification.Cri,
            x.Specification.ColorTemperature,
            x.Manufacturer,
            x.Family,
            x.Specifications
        );
}