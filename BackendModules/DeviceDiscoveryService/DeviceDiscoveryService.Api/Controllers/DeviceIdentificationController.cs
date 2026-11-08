// Controllers/DeviceIdentificationController.cs

using DeviceDiscoveryService.Api.Contracts.Requests;
using DeviceDiscoveryService.Api.Contracts.Responses;
using DeviceDiscoveryService.Application.Commands.IdentifyDevice;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeviceDiscoveryService.Api.Controllers;

[ApiController]
[Route("api/v1/device-discovery/sessions/{sessionId:guid}/devices/{deviceId:guid}")]
public sealed class DeviceIdentificationController : ControllerBase
{
    private readonly ISender _sender;

    public DeviceIdentificationController(ISender sender) => _sender = sender;

    [HttpPost("identify")]
    public async Task<ActionResult<DiscoveredDeviceResponse>> Identify(
        Guid sessionId,
        Guid deviceId,
        [FromBody] IdentifyDeviceRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(new IdentifyDeviceCommand(
            sessionId,
            deviceId,
            request.Gtin,
            request.Manufacturer,
            request.Model,
            request.FirmwareVersion,
            request.SerialNumber,
            request.DeviceType), cancellationToken);

        return Ok(DiscoveredDeviceResponse.FromDto(dto));
    }
}