using Microsoft.EntityFrameworkCore;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.ValueObjects;
using ProductCatalogService.Infrastructure.Persistence;

namespace ProductCatalogService.Infrastructure.Persistence.Seed;

public sealed class ProductCatalogSeeder
{
    private readonly ProductCatalogDbContext _db;

    public ProductCatalogSeeder(ProductCatalogDbContext db)
    {
        _db = db;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedDemoLuminaireAsync(cancellationToken);
    }

    private async Task SeedDemoLuminaireAsync(CancellationToken cancellationToken)
    {
        // Only seed once.
        var alreadyHasFiles = await _db.Set<PhotometricFile>()
            .AnyAsync(cancellationToken);
        if (alreadyHasFiles) return;

        // Find or create the demo luminaire.
        var code = new ProductCode("DEMO-PNL-600-40W-840");
        var product = await _db.Products
            .Include(p => p.PhotometricFiles)
            .FirstOrDefaultAsync(p => p.ProductCode == code, cancellationToken);

        if (product is null)
        {
            product = new Product(
                code,
                "Demo LED Panel 600×600 40W 4000K",
                ProductType.Luminaire,
                new ProductSpecification(
                    wattage: 40m,
                    lumens: 4000m,
                    cri: 80m,
                    colorTemperature: 4000m),
                new ProductDimensions(595m, 595m, 9m),
                manufacturer: "Demo");
            //             ^^^^^^^^^^^^^ new — pick a label that fits your demo tone

            _db.Products.Add(product);
            await _db.SaveChangesAsync(cancellationToken);
        }

        // Build the candlepower table: a cosine lobe from 0° to 90°,
        // zero beyond 90° (nothing emitted upward).
        var samples = new List<CandelaSample>();
        const double peakCandela = 1600.0;
        for (int deg = 0; deg <= 180; deg += 5)
        {
            double rad = deg * Math.PI / 180.0;
            double intensity = deg <= 90
                ? peakCandela * Math.Max(0, Math.Cos(rad))
                : 0.0;
            samples.Add(new CandelaSample(0, deg, intensity));
        }

        var file = new PhotometricFile(
            productId: product.Id,
            fileName: "DEMO-PNL-600-40W-840.ies",
            url: "/seed/demo-panel-600.ies",
            fileType: PhotometricFileType.IES,
            version: 1,
            uploadedAt: DateTimeOffset.UtcNow);

        file.SetParsedData(
            totalLumens: 4000,
            peakCandela: peakCandela,
            symmetry: PhotometricSymmetry.Rotational,
            samples: samples);

        file.Activate();
        product.AddPhotometricFile(file);

        await _db.SaveChangesAsync(cancellationToken);
    }
}