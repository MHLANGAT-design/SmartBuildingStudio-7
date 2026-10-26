using Microsoft.AspNetCore.Mvc;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/datasheets")]
public sealed class DatasheetsController : ControllerBase
{
    /// <summary>
    /// List datasheets for a product.
    /// </summary>
    [HttpGet("{productId:guid}")]
    public async Task<IActionResult> List(Guid productId)
    {
        // TODO: implement
        return Ok(Array.Empty<object>());
    }

    /// <summary>
    /// Upload a datasheet (PDF, DOCX, etc.) for a product.
    /// </summary>
    [HttpPost("{productId:guid}")]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB
    public async Task<IActionResult> Upload(
        Guid productId,
        [FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "A file is required." });

        // TODO: validate content type, store, persist metadata.
        return Ok(new { uploaded = true, fileName = file.FileName });
    }
}