using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.RunNetworkTest;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}/network")]
public class CommissioningNetworkController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningNetworkController(IMediator mediator) => _mediator = mediator;

    [HttpPost("tests")]
    public async Task<ActionResult<CommissioningNetworkResponse>> RunNetworkTest(Guid sessionId, [FromBody] RunNetworkTestRequest request)
    {
        var command = new RunNetworkTestCommand(sessionId, request.GatewayId, request.LineId);
        await _mediator.Send(command);

        return Ok(new CommissioningNetworkResponse
        {
            LineId = request.LineId,
            GatewayId = request.GatewayId,
            IsConnected = true,
            LastScanAt = DateTime.UtcNow
        });
    }

    [HttpGet]
    public async Task<ActionResult<CommissioningNetworkResponse>> GetNetworkState(Guid sessionId)
    {
        return Ok(new CommissioningNetworkResponse
        {
            LineId = "line-mock-01",
            GatewayId = "gw-mock-001",
            IsConnected = true,
            LastScanAt = DateTime.UtcNow
        });
    }
}