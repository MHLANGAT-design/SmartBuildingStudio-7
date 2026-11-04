using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.DiscoverDevices;
using CommissioningService.Application.Commands.RescanDevices;
using CommissioningService.Application.Queries.GetCommissioningDevices;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}")]
public class CommissioningDevicesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningDevicesController(IMediator mediator) => _mediator = mediator;

    // ── State-transitioning (commissioning workflow) ─────────────────
    // Advances the session: IDLE → DISCOVERING → ADDRESSING.
    // Called once, at the start of a commissioning session.
    [HttpPost("devices/discover")]
    public async Task<ActionResult<IEnumerable<CommissioningDeviceResponse>>> DiscoverDevices(
        Guid sessionId, [FromBody] DiscoverDevicesRequest request)
    {
        var command = new DiscoverDevicesCommand(sessionId, request.GatewayId, request.LineId);
        await _mediator.Send(command);

        return Ok(await FetchDevices(sessionId));
    }

    // ── Non-state-transitioning (programming workflow) ───────────────
    // Re-reads the gateway and refreshes device states.
    // Does NOT advance the session state machine.
    // Called by DaliProgrammingStudio at any point before session completion.
    [HttpPost("devices/rescan")]
    public async Task<ActionResult<IEnumerable<CommissioningDeviceResponse>>> RescanDevices(
        Guid sessionId, [FromBody] DiscoverDevicesRequest request)
    {
        var command = new RescanDevicesCommand(sessionId, request.GatewayId, request.LineId);
        await _mediator.Send(command);

        return Ok(await FetchDevices(sessionId));
    }

    // ── Read-only (both workflows) ───────────────────────────────────
    // Returns the current device list from the database.
    [HttpGet("devices")]
    public async Task<ActionResult<IEnumerable<CommissioningDeviceResponse>>> GetDevices(Guid sessionId)
    {
        return Ok(await FetchDevices(sessionId));
    }

    private async Task<List<CommissioningDeviceResponse>> FetchDevices(Guid sessionId)
    {
        var query = new GetCommissioningDevicesQuery(sessionId);
        var devices = await _mediator.Send(query);

        var response = new List<CommissioningDeviceResponse>();
        foreach (var d in devices)
        {
            response.Add(new CommissioningDeviceResponse
            {
                Id = d.Id,
                ExternalId = d.DeviceId,
                ShortAddress = d.ShortAddress,
                CommunicationStatus = d.ConnectionStatus,
                IsAddressed = d.IsAddressed
            });
        }
        return response;
    }
}