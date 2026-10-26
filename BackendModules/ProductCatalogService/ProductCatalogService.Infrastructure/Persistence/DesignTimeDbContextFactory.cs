using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ProductCatalogService.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ProductCatalogDbContext>
{
    public ProductCatalogDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<ProductCatalogDbContext>();
        builder.UseNpgsql("Host=localhost;Database=product_catalog_db;Username=postgres;Password=postgres");

        return new ProductCatalogDbContext(builder.Options);
    }
}