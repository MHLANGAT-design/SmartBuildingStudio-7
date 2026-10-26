using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Infrastructure.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(250)
            .IsRequired();

        builder.Property(x => x.Manufacturer)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Family)
            .HasMaxLength(200)
            .IsRequired(false);

        builder.Property(x => x.Specifications)
            .HasColumnType("text")
            .IsRequired(false);

        builder.OwnsOne(x => x.ProductCode, code =>
        {
            code.Property(c => c.Value)
                .HasColumnName("product_code")
                .HasMaxLength(100);
        });

        builder.OwnsOne(x => x.Specification, spec =>
        {
            spec.Property(x => x.Wattage);
            spec.Property(x => x.Lumens);
            spec.Property(x => x.Cri);
            spec.Property(x => x.ColorTemperature);
        });

        builder.OwnsOne(x => x.Dimensions, dim =>
        {
            dim.Property(x => x.Length);
            dim.Property(x => x.Width);
            dim.Property(x => x.Height);
        });
    }
}