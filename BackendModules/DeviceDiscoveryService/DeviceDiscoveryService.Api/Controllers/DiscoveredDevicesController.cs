// Controllers/DiscoveredDevicesController.cs

using DeviceDiscoveryService.Api.Contracts.Responses;
using DeviceDiscoveryService.Application.Queries.GetDiscoveredDevices;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeviceDiscoveryService.Api.Controllers;

[ApiController]
[Route("api/v1/device-discovery/sessions/{sessionId:guid}/devices")]
public sealed class DiscoveredDevicesController : ControllerBase
{
    private readonly ISender _sender;

    public DiscoveredDevicesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DiscoveredDeviceResponse>>> List(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var dtos = await _sender.Send(
            new GetDiscoveredDevicesQuery(sessionId), cancellationToken);

        return Ok(dtos.Select(DiscoveredDeviceResponse.FromDto).ToList());
    }
}