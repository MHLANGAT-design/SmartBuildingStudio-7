using System.Text;
using MediatR;
using ProductCatalogService.Application.Abstractions;
using ProductCatalogService.Application.Commands.PhotometricFiles;
using ProductCatalogService.Domain.Entities;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.Exceptions;
using ProductCatalogService.Domain.Parsing;
using ProductCatalogService.Domain.Repositories;

namespace ProductCatalogService.Application.Handlers;

public sealed class UploadPhotometricFileCommandHandler
    : IRequestHandler<UploadPhotometricFileCommand, UploadPhotometricFileResult>
{
    private const string StorageCategory = "photometric-files";

    private readonly IProductRepository _products;
    private readonly IFileStorage _fileStorage;

    public UploadPhotometricFileCommandHandler(
        IProductRepository products,
        IFileStorage fileStorage)
    {
        _products = products;
        _fileStorage = fileStorage;
    }

    public async Task<UploadPhotometricFileResult> Handle(
        UploadPhotometricFileCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Look up the product (also loads PhotometricFiles navigation).
        var product = await _products.GetByIdAsync(request.ProductId);
        if (product is null)
            throw new InvalidOperationException(
                $"Product {request.ProductId} not found.");

        // 2. Parse the IES content before writing anything.
        //    Failure here aborts cleanly with no file written.
        IesParser.ParseResult parsed;
        try
        {
            var iesText = Encoding.UTF8.GetString(request.FileContent);
            parsed = IesParser.Parse(iesText);
        }
        catch (IesParseException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new IesParseException(
                $"IES parser failed unexpectedly: {ex.Message}", ex);
        }

        // 3. Determine the next version number.
        var nextVersion = product.PhotometricFiles.Count == 0
            ? 1
            : product.PhotometricFiles.Max(f => f.Version) + 1;

        // 4. Save the raw file to storage.
        var stored = await _fileStorage.SaveAsync(
            category: StorageCategory,
            entityId: request.ProductId,
            fileName: request.FileName,
            content: request.FileContent,
            cancellationToken: cancellationToken);

        // 5. Deactivate existing versions (only one may be active).
        foreach (var existing in product.PhotometricFiles)
        {
            if (existing.IsActive) existing.Deactivate();
        }

        // 6. Create the new PhotometricFile, populate parsed data, activate.
        var newFile = new PhotometricFile(
            productId: request.ProductId,
            fileName: request.FileName,
            url: stored.Url,
            fileType: request.FileType,
            version: nextVersion,
            uploadedAt: DateTimeOffset.UtcNow);

        newFile.SetParsedData(
            totalLumens: parsed.TotalLumens,
            peakCandela: parsed.PeakCandela,
            symmetry: parsed.Symmetry,
            samples: parsed.Samples);

        newFile.SetHash(stored.Sha256Hex);
        newFile.Activate();

        // 7. Attach to the product aggregate and persist.
        //
        //    Order matters here:
        //
        //    a) product.AddPhotometricFile(newFile)  — adds the entity to
        //       the tracked aggregate's navigation collection. Does NOT
        //       change EF's state for the new entity — it's still
        //       "detected" only on the next DetectChanges.
        //
        //    b) _products.TrackAsNewAsync(newFile)   — explicitly marks the
        //       entity Added in the change tracker, overriding EF's
        //       key-based heuristic. Without this, EF sees Id != Guid.Empty
        //       (from Entity's constructor: Id = Guid.NewGuid()) and
        //       wrongly assumes the entity is Modified, emitting UPDATE
        //       photometric_files WHERE Id=... which matches 0 rows
        //       because the row doesn't exist yet → DbUpdateConcurrencyException.
        //
        //    c) _products.SaveChangesAsync()         — now emits a single
        //       INSERT into photometric_files. No UPDATE on the product row,
        //       no UPDATE on the new file, no spurious version check.
        product.AddPhotometricFile(newFile);
        await _products.TrackAsNewAsync(newFile, cancellationToken);
        await _products.SaveChangesAsync(cancellationToken);

        return new UploadPhotometricFileResult(
            ProductId: request.ProductId,
            PhotometricFileId: newFile.Id,
            Version: nextVersion,
            SampleCount: parsed.Samples.Count,
            TotalLumens: parsed.TotalLumens,
            PeakCandela: parsed.PeakCandela,
            Symmetry: parsed.Symmetry.ToString(),
            Url: stored.Url);
    }
}