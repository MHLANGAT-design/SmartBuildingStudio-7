using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.RunSceneTest;
using CommissioningService.Application.Queries.GetCommissioningSceneTests;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}/scenes")]
public class CommissioningScenesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningScenesController(IMediator mediator) => _mediator = mediator;

    [HttpPost("tests")]
    public async Task<ActionResult<IEnumerable<CommissioningSceneResponse>>> RunSceneTests(Guid sessionId, [FromBody] RunSceneTestRequest request)
    {
        var command = new RunSceneTestCommand(sessionId, request.SceneIds);
        await _mediator.Send(command);

        // Fetch the results we just saved to the database
        var query = new GetCommissioningSceneTestsQuery(sessionId);
        var results = await _mediator.Send(query);

        var response = new List<CommissioningSceneResponse>();
        foreach (var r in results)
        {
            response.Add(new CommissioningSceneResponse
            {
                Id = r.Id,
                SceneId = r.SceneId,
                SceneName = r.SceneName,
                Status = r.Status,
                ExecutedAt = r.ExecutedAt
            });
        }

        return Ok(response);
    }

    [HttpGet("tests")]
    public async Task<ActionResult<IEnumerable<CommissioningSceneResponse>>> GetSceneTests(Guid sessionId)
    {
        var query = new GetCommissioningSceneTestsQuery(sessionId);
        var results = await _mediator.Send(query);

        var response = new List<CommissioningSceneResponse>();
        foreach (var r in results)
        {
            response.Add(new CommissioningSceneResponse
            {
                Id = r.Id,
                SceneId = r.SceneId,
                SceneName = r.SceneName,
                Status = r.Status,
                ExecutedAt = r.ExecutedAt
            });
        }

        return Ok(response);
    }
}