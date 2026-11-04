using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Commands.CreateCommissioningSession;
using CommissioningService.Application.Queries.GetCommissioningSession;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning")]
public class CommissioningSessionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningSessionsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("start")]
    public async Task<ActionResult<CommissioningSessionResponse>> CreateSession([FromBody] CreateCommissioningSessionRequest request)
    {
        // 1. Dispatch to the Application layer
        var command = new CreateCommissioningSessionCommand(request.ProjectId, request.FloorplanId, request.StartedBy);
        var sessionId = await _mediator.Send(command);

        // 2. Fetch the full DTO to return to the frontend
        var query = new GetCommissioningSessionQuery(sessionId);
        var sessionDto = await _mediator.Send(query);

        // 3. Map to API Response (or return the DTO directly if the shape matches)
        return Ok(new CommissioningSessionResponse
        {
            SessionId = sessionDto.SessionId,
            ProjectId = sessionDto.ProjectId,
            FloorplanId = sessionDto.FloorplanId,
            Status = sessionDto.Status,
            StartedAt = sessionDto.StartedAt,
            StartedBy = sessionDto.StartedBy,
            Devices = sessionDto.Devices.Select(d => new CommissioningDeviceResponse
            {
                Id = d.Id,
                ExternalId = d.DeviceId,
                ShortAddress = d.ShortAddress,
                CommunicationStatus = d.ConnectionStatus,
                IsAddressed = d.IsAddressed
            }).ToList()
        });
    }

    [HttpGet("session/{id:guid}")]
    public async Task<ActionResult<CommissioningSessionResponse>> GetSession(Guid id)
    {
        var query = new GetCommissioningSessionQuery(id);
        var sessionDto = await _mediator.Send(query);
        return Ok(sessionDto);
    }

    // ... (Keep your Stop, Pause, Reset, Complete endpoints here)
}