namespace ProductCatalogService.Infrastructure.Services;

public sealed class CatalogExportService
{
    public async Task<byte[]> ExportProductsAsync()
    {
        return await Task.FromResult(Array.Empty<byte>());
    }
}