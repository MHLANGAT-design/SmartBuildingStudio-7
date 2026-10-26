using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductCatalogService.Domain.Entities;

namespace ProductCatalogService.Infrastructure.Configurations;

public class PriceListConfiguration : IEntityTypeConfiguration<PriceList>
{
    public void Configure(EntityTypeBuilder<PriceList> builder)
    {
        builder.ToTable("PriceLists");

        builder.HasKey(p => p.Id);

        // ProductPrice is a value object. EF Core maps owned types by
        // placing their properties in the owner's table (table splitting)
        // by default. No separate table, no repository — it is part of
        // the PriceList aggregate.
        //
        // The columns will be named "Price_Amount" and "Price_Currency"
        // unless renamed below.
        builder.OwnsOne(p => p.Price, price =>
        {
            price.Property(pp => pp.Amount)
                .HasColumnName("PriceAmount")
                .HasPrecision(18, 2)
                .IsRequired();

            price.Property(pp => pp.Currency)
                .HasColumnName("PriceCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });
    }
}