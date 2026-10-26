using Microsoft.AspNetCore.Mvc;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/manufacturers")]
public sealed class ManufacturersController : ControllerBase
{
    /// <summary>
    /// List all manufacturers.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // TODO: implement via IMediator.Send(new GetManufacturersQuery())
        return Ok(Array.Empty<object>());
    }

    /// <summary>
    /// Create a manufacturer.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateManufacturerRequest request)
    {
        // TODO: implement via IMediator.Send(new CreateManufacturerCommand(...))
        return Ok(new { created = false, reason = "Not yet implemented" });
    }
}

/// <summary>
/// Request body for POST /api/productcatalog/manufacturers.
/// Place in ProductCatalogService.Api/Requests/CreateManufacturerRequest.cs
/// when implementing.
/// </summary>
public sealed record CreateManufacturerRequest(string Name, string? Country);