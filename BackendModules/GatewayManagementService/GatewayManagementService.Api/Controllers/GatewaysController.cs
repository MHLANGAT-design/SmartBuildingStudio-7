// GatewayManagementService.Api/Controllers/GatewaysController.cs

using GatewayManagementService.Api.Contracts.Requests;
using GatewayManagementService.Api.Contracts.Responses;
using GatewayManagementService.Application.Commands.AssignGatewayToProject;
using GatewayManagementService.Application.Commands.ConfigureGateway;
using GatewayManagementService.Application.Commands.RegisterGateway;
using GatewayManagementService.Application.Commands.UnassignGatewayFromProject;
using GatewayManagementService.Application.Commands.UpdateGateway;
using GatewayManagementService.Application.Queries.GetGateway;
using GatewayManagementService.Application.Queries.GetGatewayAssignments;
using GatewayManagementService.Application.Queries.GetGateways;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GatewayManagementService.Api.Controllers;

[ApiController]
[Route("api/v1/gateways")]
public sealed class GatewaysController : ControllerBase
{
    private readonly ISender _sender;

    public GatewaysController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GatewayResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var gateways = await _sender.Send(new GetGatewaysQuery(), cancellationToken);
        return Ok(gateways.Select(ToResponse).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GatewayResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var gateway = await _sender.Send(new GetGatewayQuery(id), cancellationToken);
        if (gateway == null) return NotFound();
        return Ok(ToResponse(gateway));
    }

    [HttpPost]
    public async Task<ActionResult<GatewayResponse>> Register(
        [FromBody] RegisterGatewayRequest request,
        CancellationToken cancellationToken)
    {
        var cmd = new RegisterGatewayCommand(
            request.Name,
            request.Identifier,
            request.Transport,
            request.DaliProtocol,
            request.EndpointHost,
            request.EndpointPort,
            request.EndpointPath,
            request.DaliLineCount,
            request.PollingIntervalSeconds,
            request.CommandTimeoutSeconds,
            request.AuthToken);

        var dto = await _sender.Send(cmd, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, ToResponse(dto));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GatewayResponse>> Update(
        Guid id,
        [FromBody] UpdateGatewayRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(
            new UpdateGatewayCommand(id, request.Name, request.EndpointHost, request.EndpointPort, request.EndpointPath),
            cancellationToken);
        return Ok(ToResponse(dto));
    }

    [HttpPut("{id:guid}/configuration")]
    public async Task<ActionResult<GatewayResponse>> Configure(
        Guid id,
        [FromBody] ConfigureGatewayRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(
            new ConfigureGatewayCommand(id, request.DaliLineCount, request.PollingIntervalSeconds, request.CommandTimeoutSeconds, request.AuthToken),
            cancellationToken);
        return Ok(ToResponse(dto));
    }

    [HttpGet("{id:guid}/assignments")]
    public async Task<ActionResult<IReadOnlyList<GatewayAssignmentResponse>>> GetAssignments(Guid id, CancellationToken cancellationToken)
    {
        var assignments = await _sender.Send(new GetGatewayAssignmentsQuery(id), cancellationToken);
        return Ok(assignments.Select(ToAssignmentResponse).ToList());
    }

    [HttpPost("{id:guid}/assignments")]
    public async Task<ActionResult<GatewayAssignmentResponse>> Assign(
        Guid id,
        [FromBody] AssignGatewayToProjectRequest request,
        CancellationToken cancellationToken)
    {
        var dto = await _sender.Send(
            new AssignGatewayToProjectCommand(id, request.ProjectId, request.FloorId, request.DaliNetworkId),
            cancellationToken);
        return Ok(ToAssignmentResponse(dto));
    }

    [HttpDelete("{id:guid}/assignments/{assignmentId:guid}")]
    public async Task<IActionResult> Unassign(Guid id, Guid assignmentId, CancellationToken cancellationToken)
    {
        await _sender.Send(new UnassignGatewayFromProjectCommand(id, assignmentId), cancellationToken);
        return NoContent();
    }

    private static GatewayResponse ToResponse(Application.DTOs.GatewayDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name,
        Identifier = dto.Identifier,
        Transport = dto.Transport,
        DaliProtocol = dto.DaliProtocol,
        EndpointHost = dto.EndpointHost,
        EndpointPort = dto.EndpointPort,
        EndpointPath = dto.EndpointPath,
        ConnectionStatus = dto.ConnectionStatus,
        LastConnectedAt = dto.LastConnectedAt,
        LastSeenAt = dto.LastSeenAt,
        LastErrorMessage = dto.LastErrorMessage,
        DaliLineCount = dto.DaliLineCount,
        PollingIntervalSeconds = dto.PollingIntervalSeconds,
        CommandTimeoutSeconds = dto.CommandTimeoutSeconds
    };

    private static GatewayAssignmentResponse ToAssignmentResponse(Application.DTOs.GatewayAssignmentDto dto) => new()
    {
        Id = dto.Id,
        GatewayId = dto.GatewayId,
        ProjectId = dto.ProjectId,
        FloorId = dto.FloorId,
        DaliNetworkId = dto.DaliNetworkId,
        AssignedAt = dto.AssignedAt
    };
}