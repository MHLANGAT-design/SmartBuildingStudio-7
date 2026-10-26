using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.ValueObjects;

namespace ProductCatalogService.Infrastructure.Configurations;

public sealed class PhotometricFileConfiguration
    : IEntityTypeConfiguration<PhotometricFile>
{
    public void Configure(EntityTypeBuilder<PhotometricFile> builder)
    {
        builder.ToTable("photometric_files");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ProductId).IsRequired();
        builder.Property(x => x.FileName).IsRequired().HasMaxLength(260);
        builder.Property(x => x.Url).IsRequired().HasMaxLength(2048);
        builder.Property(x => x.FileType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Version).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.FileHash).HasMaxLength(64);
        builder.Property(x => x.UploadedAt).IsRequired();

        builder.Property(x => x.TotalLumens);
        builder.Property(x => x.PeakCandela);
        builder.Property(x => x.Symmetry).HasConversion<int>().IsRequired();

        // ── Samples: JSONB column, explicitly NOT a navigation ──
        // Tell EF Core to ignore the public Samples property. The
        // data is stored via the _samples backing field, mapped as
        // a JSONB column below.
        builder.Ignore(x => x.Samples);

        var samplesProperty = builder
            .Property<List<CandelaSample>>("_samples")
            .HasColumnName("samples")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(
                    v.Select(s => new SampleDto(
                        s.HorizontalAngle,
                        s.VerticalAngle,
                        s.Candela)),
                    (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<SampleDto>>(
                        v, (JsonSerializerOptions?)null)!
                    .Select(d => new CandelaSample(
                        d.H, d.V, d.C))
                    .ToList(),
                new ValueComparer<List<CandelaSample>>(
                    (a, b) => a!.SequenceEqual(b!),
                    v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                    v => v.ToList()));

        samplesProperty.Metadata.SetValueComparer(
            samplesProperty.Metadata.GetValueComparer());

        // ── Indexes ──────────────────────────────────────────────
        builder.HasIndex(x => x.ProductId);

        // Partial unique index: at most one active file per product.
        //
        // The filter references the PascalCase column name with
        // escaped quotes. EF Core + Npgsql generates columns with
        // quoted identifiers by default (e.g., "IsActive"), so a
        // bare `is_active = true` in the filter would fail with
        // 42703 (column does not exist) during migration.
        builder.HasIndex(x => x.ProductId)
            .HasDatabaseName("ux_photometric_files_active")
            .IsUnique()
            .HasFilter("\"IsActive\" = true");
    }

    private sealed record SampleDto(double H, double V, double C);
}