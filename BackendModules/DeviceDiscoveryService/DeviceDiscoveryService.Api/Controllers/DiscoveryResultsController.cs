// Controllers/DiscoveryResultsController.cs

using DeviceDiscoveryService.Api.Contracts.Responses;
using DeviceDiscoveryService.Application.Queries.GetDiscoveryResults;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeviceDiscoveryService.Api.Controllers;

[ApiController]
[Route("api/v1/device-discovery/sessions/{sessionId:guid}/results")]
public sealed class DiscoveryResultsController : ControllerBase
{
    private readonly ISender _sender;

    public DiscoveryResultsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<DiscoveryResultResponse>> Get(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(
            new GetDiscoveryResultsQuery(sessionId), cancellationToken);

        return dto is null ? NotFound() : Ok(DiscoveryResultResponse.FromDto(dto));
    }
}