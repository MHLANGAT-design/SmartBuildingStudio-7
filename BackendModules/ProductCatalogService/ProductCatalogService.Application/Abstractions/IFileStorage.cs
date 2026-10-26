namespace ProductCatalogService.Application.Abstractions;

/// <summary>
/// Storage abstraction for files uploaded to the catalog (IES, LDT,
/// datasheets, certifications). Backed by the filesystem in dev, and by
/// blob storage in prod. The URL returned by <see cref="SaveAsync"/> is
/// stable and directly retrievable via a controller endpoint.
/// </summary>
public interface IFileStorage
{
    /// <summary>
    /// Save a file. Idempotent: if a file with the same hash already
    /// exists at the same path, returns the existing URL without
    /// rewriting.
    /// </summary>
    Task<StoredFile> SaveAsync(
        string category,
        Guid entityId,
        string fileName,
        byte[] content,
        CancellationToken cancellationToken);

    /// <summary>Open the stored file for reading. Returns null if missing.</summary>
    Task<Stream?> OpenReadAsync(string url, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(string url, CancellationToken cancellationToken);

    /// <summary>Delete the stored file. No-op if missing.</summary>
    Task DeleteAsync(string url, CancellationToken cancellationToken);
}

public sealed record StoredFile(
    string Url,
    string StoragePath,
    string Sha256Hex
);