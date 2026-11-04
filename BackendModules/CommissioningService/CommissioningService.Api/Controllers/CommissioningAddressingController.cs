using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.AssignDeviceAddresses;
using CommissioningService.Application.Commands.ReprogramDeviceAddress;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}")]
public class CommissioningAddressingController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningAddressingController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// State-transitioning address assignment (commissioning workflow).
    /// Only valid while session is in ADDRESSING state.
    /// </summary>
    [HttpPost("addressing")]
    public async Task<ActionResult<CommissioningAddressingResponse>> AssignAddress(
        Guid sessionId,
        [FromBody] AssignDeviceAddressesRequest request)
    {
        var command = new AssignDeviceAddressesCommand(sessionId, request.DeviceExternalId, request.Address);
        await _mediator.Send(command);

        return Ok(new CommissioningAddressingResponse
        {
            DeviceExternalId = request.DeviceExternalId,
            ShortAddress = request.Address,
            IsVerified = true
        });
    }

    /// <summary>
    /// Non-state-transitioning re-addressing (DALI Programming module).
    /// Can be called at any point before the session is completed.
    /// </summary>
    [HttpPost("addressing/reprogram")]
    public async Task<ActionResult<CommissioningAddressingResponse>> ReprogramAddress(
        Guid sessionId,
        [FromBody] AssignDeviceAddressesRequest request)
    {
        var command = new ReprogramDeviceAddressCommand(sessionId, request.DeviceExternalId, request.Address);
        await _mediator.Send(command);

        return Ok(new CommissioningAddressingResponse
        {
            DeviceExternalId = request.DeviceExternalId,
            ShortAddress = request.Address,
            IsVerified = true
        });
    }
}