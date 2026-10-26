using Microsoft.AspNetCore.Mvc;

namespace ProductCatalogService.Api.Controllers;

[ApiController]
[Route("api/productcatalog/categories")]
public sealed class CategoriesController : ControllerBase
{
    /// <summary>
    /// List all categories.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // TODO: implement via IMediator.Send(new GetCategoriesQuery())
        return Ok(Array.Empty<object>());
    }

    /// <summary>
    /// Create a category.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        // TODO: implement via IMediator.Send(new CreateCategoryCommand(...))
        return Ok(new { created = false, reason = "Not yet implemented" });
    }
}

/// <summary>
/// Request body for POST /api/productcatalog/categories.
/// Place in ProductCatalogService.Api/Requests/CreateCategoryRequest.cs
/// when implementing.
/// </summary>
public sealed record CreateCategoryRequest(string Name, string? Description);