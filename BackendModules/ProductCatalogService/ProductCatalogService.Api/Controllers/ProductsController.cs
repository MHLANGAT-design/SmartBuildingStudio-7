using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProductCatalogService.Api.Requests;
using ProductCatalogService.Application.Commands.Products;
using ProductCatalogService.Application.Queries.Products;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// List products with optional filters. All query parameters are
    /// optional; omitted parameters apply no filter. Multiple filters
    /// combine with AND.
    ///
    /// Query parameters:
    ///   • manufacturer — case-insensitive exact match
    ///   • family       — case-insensitive exact match
    ///   • type         — numeric ProductType enum value
    ///   • search       — case-insensitive substring across
    ///                    Name, ProductCode, and Manufacturer
    ///
    /// Returns an empty array when no products match — not a 404.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? manufacturer = null,
        [FromQuery] string? family = null,
        [FromQuery] int? type = null,
        [FromQuery] string? search = null)
    {
        var filters = new ProductFilters(
            Manufacturer: manufacturer,
            Family: family,
            ProductType: type,
            Search: search);

        var result = await _mediator.Send(new GetProductsQuery(filters));
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var result = await _mediator.Send(new GetProductByIdQuery(id));
        if (result is null) return NotFound();
        return Ok(result);
    }

    /// <summary>
    /// List the distinct manufacturer names present in the catalog.
    /// Excludes products with no manufacturer. Sorted alphabetically.
    /// </summary>
    [HttpGet("manufacturers")]
    public async Task<IActionResult> GetManufacturers()
    {
        var result = await _mediator.Send(new GetDistinctManufacturersQuery());
        return Ok(result);
    }

    /// <summary>
    /// Manufacturer aggregate: one row per distinct manufacturer with
    /// its product count. Sorted alphabetically by name.
    /// </summary>
    [HttpGet("manufacturer-stats")]
    public async Task<IActionResult> GetManufacturerStats()
    {
        var result = await _mediator.Send(new GetManufacturerStatsQuery());
        return Ok(result);
    }

    /// <summary>
    /// List the distinct family names present in the catalog.
    /// Excludes products with no family. Sorted alphabetically.
    /// </summary>
    [HttpGet("families")]
    public async Task<IActionResult> GetFamilies()
    {
        var result = await _mediator.Send(new GetDistinctFamiliesQuery());
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct(CreateProductRequest request)
    {
        var id = await _mediator.Send(new CreateProductCommand(
            request.ProductCode,
            request.Name,
            request.ProductType,
            request.Wattage,
            request.Lumens,
            request.Cri,
            request.ColorTemperature,
            request.Manufacturer));

        return CreatedAtAction(nameof(GetProduct), new { id }, id);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _mediator.Send(new DeleteProductCommand(id));
        return NoContent();
    }
}