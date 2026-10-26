using Microsoft.EntityFrameworkCore;
using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Infrastructure.Persistence;

public sealed class ProductCatalogDbContext : DbContext
{
    public ProductCatalogDbContext(DbContextOptions<ProductCatalogDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<ProductCategory> Categories => Set<ProductCategory>();
    public DbSet<Datasheet> Datasheets => Set<Datasheet>();
    public DbSet<PhotometricFile> PhotometricFiles => Set<PhotometricFile>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<PriceList> PriceLists => Set<PriceList>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(typeof(ProductCatalogDbContext).Assembly);
        
        base.OnModelCreating(builder);
    }
}