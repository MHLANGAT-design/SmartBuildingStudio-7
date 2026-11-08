// Controllers/DiscoverySessionsController.cs

using DeviceDiscoveryService.Api.Contracts.Requests;
using DeviceDiscoveryService.Api.Contracts.Responses;
using DeviceDiscoveryService.Application.Commands.CancelDiscovery;
using DeviceDiscoveryService.Application.Commands.CreateDiscoverySession;
using DeviceDiscoveryService.Application.Commands.StartDiscovery;
using DeviceDiscoveryService.Application.Commands.StopDiscovery;
using DeviceDiscoveryService.Application.Queries.GetDiscoverySession;
using DeviceDiscoveryService.Application.Queries.GetDiscoverySessions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeviceDiscoveryService.Api.Controllers;

[ApiController]
[Route("api/v1/device-discovery/sessions")]
public sealed class DiscoverySessionsController : ControllerBase
{
    private readonly ISender _sender;

    public DiscoverySessionsController(ISender sender) => _sender = sender;

    [HttpPost]
    public async Task<ActionResult<DiscoverySessionResponse>> Create(
        [FromBody] CreateDiscoverySessionRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(new CreateDiscoverySessionCommand(
            request.ProjectId,
            request.BuildingId,
            request.FloorId,
            request.DrawingDocumentId,
            request.GatewayId,
            request.LineIds,
            request.StartedBy ?? "system"), cancellationToken);

        return CreatedAtAction(
            nameof(Get),
            new { id = dto.Id },
            DiscoverySessionResponse.FromDto(dto));
    }

    [HttpPost("{id:guid}/start")]
    public async Task<ActionResult<DiscoverySessionResponse>> Start(
        Guid id,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(new StartDiscoveryCommand(id), cancellationToken);
        return Ok(DiscoverySessionResponse.FromDto(dto));
    }

    [HttpPost("{id:guid}/stop")]
    public async Task<IActionResult> Stop(Guid id, CancellationToken cancellationToken)
    {
        await _sender.Send(new StopDiscoveryCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await _sender.Send(new CancelDiscoveryCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DiscoverySessionResponse>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(new GetDiscoverySessionQuery(id), cancellationToken);
        return dto is null ? NotFound() : Ok(DiscoverySessionResponse.FromDto(dto));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DiscoverySessionResponse>>> List(
        [FromQuery] Guid? projectId,
        [FromQuery] Guid? floorId,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var dtos = await _sender.Send(
            new GetDiscoverySessionsQuery(projectId, floorId, take), cancellationToken);

        return Ok(dtos.Select(DiscoverySessionResponse.FromDto).ToList());
    }
}