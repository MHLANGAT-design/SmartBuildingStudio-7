// Controllers/DiscoveryHistoryController.cs

using DeviceDiscoveryService.Api.Contracts.Responses;
using DeviceDiscoveryService.Application.Queries.GetDiscoveryHistory;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeviceDiscoveryService.Api.Controllers;

[ApiController]
[Route("api/v1/device-discovery/sessions/{sessionId:guid}/history")]
public sealed class DiscoveryHistoryController : ControllerBase
{
    private readonly ISender _sender;

    public DiscoveryHistoryController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DiscoveryHistoryResponse>>> Get(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var dtos = await _sender.Send(
            new GetDiscoveryHistoryQuery(sessionId), cancellationToken);

        return Ok(dtos.Select(DiscoveryHistoryResponse.FromDto).ToList());
    }
}