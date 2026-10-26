using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProductCatalogService.Api.Requests;
using ProductCatalogService.Application.Commands.Products;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Infrastructure.Services;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/catalog/import")]
public sealed class CatalogImportController : ControllerBase
{
    private readonly CatalogImportService _csvService;
    private readonly IMediator _mediator;

    public CatalogImportController(
        CatalogImportService csvService,
        IMediator mediator)
    {
        _csvService = csvService;
        _mediator = mediator;
    }

    /// <summary>
    /// Import products from a CSV file. (existing endpoint, unchanged)
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
    public async Task<IActionResult> Import([FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "A CSV file is required." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only .csv files are accepted." });

        await using var stream = file.OpenReadStream();
        await _csvService.ImportCsvAsync(stream);

        return Ok(new { imported = true, fileName = file.FileName });
    }

    /// <summary>
    /// Import products from a JSON array. Each item is a ProductDto-shaped
    /// object: productCode, name, productType, manufacturer are required;
    /// wattage/lumens/cri/colorTemperature default to 0 when omitted;
    /// family and specifications are optional.
    ///
    /// This endpoint is manufacturer-agnostic. Vendor-specific mapping
    /// (Tridonic's article_number, Philips' productId, etc.) happens in a
    /// frontend/script-side converter that produces this shape. See
    /// scripts/import-catalogs/README.md.
    /// </summary>
    [HttpPost("json")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> ImportJson(
        [FromBody] ProductImportItem[] items,
        CancellationToken ct)
    {
        if (items is null || items.Length == 0)
            return BadRequest(new { error = "No products provided." });

        var imported = 0;
        var errors = new List<object>();

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.ProductCode) ||
                string.IsNullOrWhiteSpace(item.Name) ||
                string.IsNullOrWhiteSpace(item.ProductType) ||
                string.IsNullOrWhiteSpace(item.Manufacturer))
            {
                errors.Add(new
                {
                    productCode = item.ProductCode ?? "(missing)",
                    error = "productCode, name, productType, manufacturer are required.",
                });
                continue;
            }

            // Serialize whatever the converter put in `specifications`
            // (object, array, string, null) into JSON text for storage.
            string? specsJson = null;
            if (item.Specifications.HasValue &&
                item.Specifications.Value.ValueKind != JsonValueKind.Null)
            {
                specsJson = item.Specifications.Value.GetRawText();
            }

            try
            {
                // Translate the string productType ("Driver", "Luminaire", …)
                // to the numeric enum value the command layer expects.
                if (!Enum.TryParse<ProductType>(
                        item.ProductType, ignoreCase: true, out var parsedType))
                {
                    errors.Add(new
                    {
                        productCode = item.ProductCode,
                        error = $"Unknown productType '{item.ProductType}'. " +
                                $"Expected one of: Luminaire, Driver, Controller, " +
                                $"Sensor, Gateway, EmergencyUnit, PowerSupply, Switch.",
                    });
                    continue;
                }

                await _mediator.Send(new CreateProductCommand(
                    ProductCode: item.ProductCode,
                    Name: item.Name,
                    ProductType: (int)parsedType,
                    Wattage: item.Wattage ?? 0,
                    Lumens: item.Lumens ?? 0,
                    Cri: item.Cri ?? 0,
                    ColorTemperature: item.ColorTemperature ?? 0,
                    Manufacturer: item.Manufacturer,
                    Family: item.Family,
                    Specifications: specsJson
                ), ct);
                imported++;
            }
            catch (Exception ex)
            {
                errors.Add(new
                {
                    productCode = item.ProductCode,
                    error = ex.Message,
                });
            }
        }

        return Ok(new
        {
            imported,
            failed = errors.Count,
            errors,
        });
    }
}

/// <summary>
/// Shape accepted by POST /api/productcatalog/catalog/import/json.
///
/// `specifications` is typed as JsonElement so the endpoint can accept
/// any structure without knowing its schema — the whole point of the
/// generic importer.
/// </summary>
public sealed record ProductImportItem(
    string ProductCode,
    string Name,
    string ProductType,
    string Manufacturer,
    decimal? Wattage = null,
    decimal? Lumens = null,
    decimal? Cri = null,
    decimal? ColorTemperature = null,
    string? Family = null,
    JsonElement? Specifications = null
);