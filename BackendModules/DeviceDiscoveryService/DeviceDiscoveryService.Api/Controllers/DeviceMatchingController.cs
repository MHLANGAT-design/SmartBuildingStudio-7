// Controllers/DeviceMatchingController.cs

using DeviceDiscoveryService.Api.Contracts.Responses;
using DeviceDiscoveryService.Application.Commands.MatchDiscoveredDevices;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeviceDiscoveryService.Api.Controllers;

[ApiController]
[Route("api/v1/device-discovery/sessions/{sessionId:guid}")]
public sealed class DeviceMatchingController : ControllerBase
{
    private readonly ISender _sender;

    public DeviceMatchingController(ISender sender) => _sender = sender;

    [HttpPost("match")]
    public async Task<ActionResult<DiscoverySessionResponse>> Match(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(
            new MatchDiscoveredDevicesCommand(sessionId), cancellationToken);

        return Ok(DiscoverySessionResponse.FromDto(dto));
    }
}