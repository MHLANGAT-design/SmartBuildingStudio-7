using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.RunCommissioningTest;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}")]
public class CommissioningTestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningTestsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("tests")]
    public async Task<ActionResult<CommissioningTestResponse>> RunTest(Guid sessionId, [FromBody] RunCommissioningTestRequest request)
    {
        var command = new RunCommissioningTestCommand(sessionId, request.TestType);
        await _mediator.Send(command);

        return Ok(new CommissioningTestResponse
        {
            TestId = Guid.NewGuid(),
            TestType = request.TestType,
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddSeconds(-2),
            CompletedAt = DateTime.UtcNow
        });
    }

    [HttpGet("tests")]
    public async Task<ActionResult<IEnumerable<CommissioningTestResultResponse>>> GetTestResults(Guid sessionId)
    {
        // Return empty for now; the query handler can be wired later.
        return Ok(new List<CommissioningTestResultResponse>());
    }
}