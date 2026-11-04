using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.DetectCommissioningFaults;
using CommissioningService.Application.Commands.ResolveCommissioningDefect;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning")]
public class CommissioningFaultsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningFaultsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("session/{sessionId:guid}/faults/detect")]
    public async Task<ActionResult<IEnumerable<CommissioningFaultResponse>>> DetectFaults(Guid sessionId)
    {
        var command = new DetectCommissioningFaultsCommand(sessionId);
        await _mediator.Send(command);

        return Ok(new List<CommissioningFaultResponse>());
    }

    [HttpGet("session/{sessionId:guid}/faults")]
    public async Task<ActionResult<IEnumerable<CommissioningFaultResponse>>> GetFaults(Guid sessionId)
    {
        return Ok(new List<CommissioningFaultResponse>());
    }

    [HttpPatch("faults/{id:guid}")]
    public async Task<IActionResult> ResolveFault(Guid id, [FromBody] ResolveCommissioningDefectRequest request)
    {
        var command = new ResolveCommissioningDefectCommand(request.SessionId, id, request.ResolvedBy);
        await _mediator.Send(command);

        return Ok(new { message = "Fault resolved." });
    }
}