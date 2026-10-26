using System.Security.Cryptography;
using ProductCatalogService.Application.Abstractions;

namespace ProductCatalogService.Infrastructure.Storage;

/// <summary>
/// Filesystem-backed implementation of <see cref="IFileStorage"/>.
///
/// Storage layout:
///   {rootPath}/{category}/{entityId}/{fileName}
///
/// The returned URL is:
///   /api/productcatalog/{category}/{entityId}/file/{fileName}
///
/// The URL is stable across restarts and machine migrations as long as
/// the {rootPath} contents are preserved. Move to blob storage by
/// swapping this class for a new implementation — no call sites change.
/// </summary>
public sealed class FileSystemFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public FileSystemFileStorage(string rootPath)
    {
        _rootPath = Path.GetFullPath(rootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<StoredFile> SaveAsync(
        string category,
        Guid entityId,
        string fileName,
        byte[] content,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new ArgumentException("Category is required.", nameof(category));
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("FileName is required.", nameof(fileName));

        // Sanitize fileName: no path traversal, no directory separators.
        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
            throw new ArgumentException("FileName is invalid after sanitization.", nameof(fileName));

        var relativePath = Path.Combine(category, entityId.ToString("D"), safeFileName);
        var absolutePath = Path.Combine(_rootPath, relativePath);

        // Ensure the directory exists.
        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        // Compute the hash.
        var sha256Hex = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();

        // Idempotent write: skip if the file already exists and matches.
        if (File.Exists(absolutePath))
        {
            var existing = await File.ReadAllBytesAsync(absolutePath, cancellationToken);
            var existingHash = Convert.ToHexString(SHA256.HashData(existing)).ToLowerInvariant();
            if (existingHash == sha256Hex)
            {
                var url = BuildUrl(category, entityId, safeFileName);
                return new StoredFile(url, absolutePath, sha256Hex);
            }
        }

        await File.WriteAllBytesAsync(absolutePath, content, cancellationToken);

        return new StoredFile(
            BuildUrl(category, entityId, safeFileName),
            absolutePath,
            sha256Hex);
    }

    public Task<Stream?> OpenReadAsync(string url, CancellationToken cancellationToken)
    {
        // Parse the URL back to a path. URL format:
        //   /api/productcatalog/{category}/{entityId}/file/{fileName}
        var relativePath = ExtractRelativePath(url);
        if (relativePath is null)
            return Task.FromResult<Stream?>(null);

        var absolutePath = Path.Combine(_rootPath, relativePath);
        if (!File.Exists(absolutePath))
            return Task.FromResult<Stream?>(null);

        Stream stream = File.OpenRead(absolutePath);
        return Task.FromResult<Stream?>(stream);
    }

    public Task<bool> ExistsAsync(string url, CancellationToken cancellationToken)
    {
        var relativePath = ExtractRelativePath(url);
        if (relativePath is null) return Task.FromResult(false);
        return Task.FromResult(File.Exists(Path.Combine(_rootPath, relativePath)));
    }

    public Task DeleteAsync(string url, CancellationToken cancellationToken)
    {
        var relativePath = ExtractRelativePath(url);
        if (relativePath is null) return Task.CompletedTask;
        var absolutePath = Path.Combine(_rootPath, relativePath);
        if (File.Exists(absolutePath))
            File.Delete(absolutePath);
        return Task.CompletedTask;
    }

    // ── Helpers ────────────────────────────────────────────────

    private static string BuildUrl(string category, Guid entityId, string fileName) =>
        $"/api/productcatalog/{category}/{entityId:D}/file/{Uri.EscapeDataString(fileName)}";

    private static string? ExtractRelativePath(string url)
    {
        // Accept "/api/productcatalog/{category}/{entityId}/file/{fileName}"
        var marker = "/file/";
        var idx = url.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return null;

        // Everything before "/file/" is ".../{category}/{entityId}".
        var pathBeforeFile = url[..idx];
        var fileName = Uri.UnescapeDataString(url[(idx + marker.Length)..]);

        // Last two segments of pathBeforeFile are {category}/{entityId}.
        var segments = pathBeforeFile.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length < 2) return null;

        var entityId = segments[^1];
        var category = segments[^2];

        return Path.Combine(category, entityId, fileName);
    }
}