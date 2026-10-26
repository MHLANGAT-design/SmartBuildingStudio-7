using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProductCatalogService.Application.Abstractions;
using ProductCatalogService.Application.Commands.PhotometricFiles;
using ProductCatalogService.Application.Queries.PhotometricFiles;
using ProductCatalogService.Domain.Enums;
using ProductCatalogService.Domain.Exceptions;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/photometric-files")]
public sealed class PhotometricFilesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IFileStorage _fileStorage;

    public PhotometricFilesController(
        IMediator mediator,
        IFileStorage fileStorage)
    {
        _mediator = mediator;
        _fileStorage = fileStorage;
    }

    /// <summary>
    /// Upload a photometric file (IES/LDT) for a product. The file is
    /// parsed, samples stored, and marked as the active version. Previous
    /// versions are deactivated but kept (audit trail, rollback).
    /// </summary>
    [HttpPost("{productId:guid}")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB — IES files are tiny
    public async Task<IActionResult> Upload(
        Guid productId,
        [FromForm] IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "A file is required." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        PhotometricFileType fileType;
        switch (ext)
        {
            case ".ies": fileType = PhotometricFileType.IES; break;
            case ".ldt": fileType = PhotometricFileType.LDT; break;
            default:
                return BadRequest(new
                {
                    error = $"Unsupported file extension '{ext}'. " +
                            "Only .ies and .ldt files are accepted."
                });
        }

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, cancellationToken);

        try
        {
            var result = await _mediator.Send(
                new UploadPhotometricFileCommand(
                    ProductId: productId,
                    FileName: file.FileName,
                    FileContent: ms.ToArray(),
                    FileType: fileType),
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            // Product not found.
            return NotFound(new { error = ex.Message });
        }
        catch (IesParseException ex)
        {
            return BadRequest(new { error = $"IES parse failed: {ex.Message}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = $"Upload failed: {ex.Message}",
                type = ex.GetType().Name
            });
        }
    }

    /// <summary>
    /// Serve the raw IES/LDT file for download or inspection.
    /// </summary>
    [HttpGet("{productId:guid}/file/{fileName}")]
    public async Task<IActionResult> Download(
        Guid productId,
        string fileName,
        CancellationToken cancellationToken)
    {
        var url = $"/api/productcatalog/photometric-files/{productId:D}/file/{Uri.EscapeDataString(fileName)}";
        var stream = await _fileStorage.OpenReadAsync(url, cancellationToken);
        if (stream is null) return NotFound();
        return File(stream, "application/octet-stream", fileName);
    }

    /// <summary>
    /// Return the active photometric distribution (candlepower table)
    /// for a product. Consumed by FixturePlacementStudio's illuminance
    /// calculator, via the ProductCatalogApi client.
    ///
    /// Uses the ~/ route escape to sit under the products resource
    /// rather than the photometric-files resource.
    /// </summary>
    [HttpGet("~/api/productcatalog/products/{productId:guid}/photometric-distribution")]
    public async Task<IActionResult> GetDistribution(Guid productId)
    {
        var result = await _mediator.Send(
            new GetPhotometricDistributionQuery(productId));

        if (result is null) return NotFound();
        return Ok(result);
    }
}