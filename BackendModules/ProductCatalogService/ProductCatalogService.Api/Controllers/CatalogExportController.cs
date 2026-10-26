using Microsoft.AspNetCore.Mvc;
using ProductCatalogService.Infrastructure.Services;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/catalog/export")]
public sealed class CatalogExportController : ControllerBase
{
    private readonly CatalogExportService _service;

    public CatalogExportController(CatalogExportService service)
    {
        _service = service;
    }

    /// <summary>
    /// Export the product catalog as a CSV file.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Export()
    {
        var file = await _service.ExportProductsAsync();
        return File(file, "text/csv", "products.csv");
    }
}