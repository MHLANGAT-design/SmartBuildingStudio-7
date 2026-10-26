using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using FloorPlanService.Application.UseCases;

namespace FloorPlanService.Api.Controllers;

[ApiController]
[Route("api/v1/floorplan-designer")]
public class DxfFloorPlanController : ControllerBase
{
    private readonly ImportFloorPlanCommandHandler _commandHandler;

    public DxfFloorPlanController(ImportFloorPlanCommandHandler commandHandler)
    {
        _commandHandler = commandHandler ?? throw new ArgumentNullException(nameof(commandHandler));
    }

    [HttpPost("import")]
    [DisableRequestSizeLimit] // Completely removes the request body size limit for this endpoint
    [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)] // Allows unlimited multipart body size
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult Import([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Payload transaction stream cannot be empty.");

        try
        {
            using var readStream = file.OpenReadStream();
            var architecturalResult = _commandHandler.Execute(readStream, file.FileName);
            return Ok(architecturalResult);
        }
        catch (NotSupportedException nex)
        {
            return BadRequest(nex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal structural process exception context error: {ex.Message}");
        }
    }
}