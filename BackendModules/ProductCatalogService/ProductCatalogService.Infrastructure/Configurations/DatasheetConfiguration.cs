using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Infrastructure.Configurations;

public class DatasheetConfiguration : IEntityTypeConfiguration<Datasheet>
{
    public void Configure(EntityTypeBuilder<Datasheet> builder)
    {
        builder.ToTable("Datasheets");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.Url)
            .IsRequired()
            .HasMaxLength(500);
    }
}