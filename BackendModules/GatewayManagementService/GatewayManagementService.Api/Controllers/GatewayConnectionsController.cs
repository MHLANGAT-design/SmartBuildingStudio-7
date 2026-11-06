// GatewayManagementService.Api/Controllers/GatewayConnectionsController.cs

using GatewayManagementService.Api.Contracts.Responses;
using GatewayManagementService.Application.Commands.ConnectGateway;
using GatewayManagementService.Application.Commands.DisconnectGateway;
using GatewayManagementService.Application.Commands.ReconnectGateway;
using GatewayManagementService.Application.Queries.GetGatewayConnections;
using GatewayManagementService.Application.Queries.GetGatewayStatus;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GatewayManagementService.Api.Controllers;

[ApiController]
[Route("api/v1/gateways/{id:guid}")]
public sealed class GatewayConnectionsController : ControllerBase
{
    private readonly ISender _sender;

    public GatewayConnectionsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("status")]
    public async Task<ActionResult<GatewayStatusResponse>> GetStatus(Guid id, CancellationToken cancellationToken)
    {
        var status = await _sender.Send(new GetGatewayStatusQuery(id), cancellationToken);
        if (status == null) return NotFound();
        return Ok(new GatewayStatusResponse
        {
            GatewayId = status.GatewayId,
            ConnectionStatus = status.ConnectionStatus,
            LastConnectedAt = status.LastConnectedAt,
            LastSeenAt = status.LastSeenAt,
            LastErrorMessage = status.LastErrorMessage,
            IsReachable = status.IsReachable
        });
    }

    [HttpGet("connections")]
    public async Task<ActionResult<IReadOnlyList<GatewayConnectionResponse>>> GetConnections(Guid id, CancellationToken cancellationToken)
    {
        var connections = await _sender.Send(new GetGatewayConnectionsQuery(id), cancellationToken);
        return Ok(connections.Select(c => new GatewayConnectionResponse
        {
            Id = c.Id,
            ConnectedAt = c.ConnectedAt,
            DisconnectedAt = c.DisconnectedAt,
            DisconnectReason = c.DisconnectReason,
            RemoteEndpoint = c.RemoteEndpoint,
            IsOpen = c.IsOpen
        }).ToList());
    }

    [HttpPost("connect")]
    public async Task<IActionResult> Connect(Guid id, CancellationToken cancellationToken)
    {
        await _sender.Send(new ConnectGatewayCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect(Guid id, [FromQuery] string? reason, CancellationToken cancellationToken)
    {
        await _sender.Send(new DisconnectGatewayCommand(id, reason), cancellationToken);
        return NoContent();
    }

    [HttpPost("reconnect")]
    public async Task<IActionResult> Reconnect(Guid id, CancellationToken cancellationToken)
    {
        await _sender.Send(new ReconnectGatewayCommand(id), cancellationToken);
        return NoContent();
    }
}