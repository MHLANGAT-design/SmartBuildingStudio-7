// FloorPlansController.cs
using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using FloorPlanService.Application.FloorPlans.Commands;
using FloorPlanService.Application.FloorPlans.Queries;

namespace FloorPlanService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]           // ← Original route: api/FloorPlans
[Route("api/v1/floorplan-designer")]  // ← NEW: Support v1 route
public partial class FloorPlansController : ControllerBase
{
    private readonly IMediator _mediator;

    public FloorPlansController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetFloorPlans(CancellationToken cancellationToken)
    {
        var query = new GetAllFloorPlansQuery();
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetFloorPlanById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetFloorPlanByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);
        
        if (result == null)
        {
            return NotFound(new { message = $"Floor plan with ID '{id}' was not found." });
        }
        
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFloorPlanLayout(
        Guid id,
        [FromBody] UpdateFloorPlanCommand command,
        CancellationToken cancellationToken)
    {
        if (command == null)
        {
            return BadRequest("The incoming comprehensive multi-floor blueprint payload cannot be empty.");
        }

        if (id != command.FloorPlanId)
        {
            return BadRequest("The ID in the route does not match the ID in the payload.");
        }

        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFloorPlan(
        [FromBody] CreateFloorPlanCommand command,
        CancellationToken cancellationToken)
    {
        if (command == null)
        {
            return BadRequest("The floor plan payload cannot be empty.");
        }

        var id = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetFloorPlanById), new { id }, new { id });
    }
}