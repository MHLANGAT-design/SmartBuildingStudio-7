// GatewayManagementService.Api/Controllers/GatewayDiagnosticsController.cs

using GatewayManagementService.Api.Contracts.Requests;
using GatewayManagementService.Api.Contracts.Responses;
using GatewayManagementService.Application.Commands.RunGatewayDiagnostics;
using GatewayManagementService.Application.Queries.GetGatewayDiagnostics;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GatewayManagementService.Api.Controllers;

[ApiController]
[Route("api/v1/gateways/{id:guid}/diagnostics")]
public sealed class GatewayDiagnosticsController : ControllerBase
{
    private readonly ISender _sender;

    public GatewayDiagnosticsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<ActionResult<GatewayDiagnosticsResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(new GetGatewayDiagnosticsQuery(id), cancellationToken);
        return Ok(ToResponse(dto));
    }

    [HttpPost("run")]
    public async Task<ActionResult<GatewayDiagnosticsResponse>> Run(
        Guid id,
        [FromBody] RunGatewayDiagnosticsRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(new RunGatewayDiagnosticsCommand(id), cancellationToken);
        return Ok(ToResponse(dto));
    }

    private static GatewayDiagnosticsResponse ToResponse(Application.DTOs.GatewayDiagnosticsDto dto) => new()
    {
        GatewayId = dto.GatewayId,
        IsHealthy = dto.IsHealthy,
        LatencyMs = dto.LatencyMs,
        ErrorMessage = dto.ErrorMessage,
        CheckedAt = dto.CheckedAt,
        Checks = dto.Checks.Select(c => new GatewayDiagnosticCheckResponse
        {
            Name = c.Name,
            Passed = c.Passed,
            LatencyMs = c.LatencyMs,
            Detail = c.Detail
        }).ToList()
    };
}