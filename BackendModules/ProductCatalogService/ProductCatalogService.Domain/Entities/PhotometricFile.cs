using BuildingBlocks.Domain;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.ValueObjects;

namespace ProductCatalogService.Domain.Entities;

public sealed class PhotometricFile : Entity
{
    public Guid ProductId { get; private set; }

    public string FileName { get; private set; }
    public string Url { get; private set; }
    public PhotometricFileType FileType { get; private set; }

    /// <summary>Monotonic per-product version. 1 for the first upload.</summary>
    public int Version { get; private set; }

    /// <summary>Only one file per product may be active at a time.</summary>
    public bool IsActive { get; private set; }

    /// <summary>SHA-256 of the file bytes; used to detect duplicate uploads.</summary>
    public string? FileHash { get; private set; }

    public DateTimeOffset UploadedAt { get; private set; }

    // ── Cached parse results ────────────────────────────────────────
    public double? TotalLumens { get; private set; }
    public double? PeakCandela { get; private set; }
    public PhotometricSymmetry Symmetry { get; private set; }

    private readonly List<CandelaSample> _samples = new();
    public IReadOnlyCollection<CandelaSample> Samples => _samples;

    private PhotometricFile()
    {
        FileName = string.Empty;
        Url = string.Empty;
    }

    public PhotometricFile(
        Guid productId,
        string fileName,
        string url,
        PhotometricFileType fileType,
        int version,
        DateTimeOffset uploadedAt)
    {
        if (productId == Guid.Empty)
            throw new ArgumentException("ProductId is required.", nameof(productId));
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("FileName is required.", nameof(fileName));
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("Url is required.", nameof(url));
        if (version < 1)
            throw new ArgumentException("Version must be >= 1.", nameof(version));

        ProductId = productId;
        FileName = fileName;
        Url = url;
        FileType = fileType;
        Version = version;
        UploadedAt = uploadedAt;
        IsActive = false;
        Symmetry = PhotometricSymmetry.None;
    }

    /// <summary>
    /// Populate the parsed candlepower table. Called once by the upload
    /// handler after the IES/LDT parser produces its output.
    /// </summary>
    public void SetParsedData(
        double totalLumens,
        double peakCandela,
        PhotometricSymmetry symmetry,
        IEnumerable<CandelaSample> samples)
    {
        if (totalLumens < 0) throw new ArgumentOutOfRangeException(nameof(totalLumens));
        if (peakCandela < 0) throw new ArgumentOutOfRangeException(nameof(peakCandela));

        TotalLumens = totalLumens;
        PeakCandela = peakCandela;
        Symmetry = symmetry;

        _samples.Clear();
        _samples.AddRange(samples);
    }

    public void SetHash(string fileHash)
    {
        FileHash = fileHash;
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}