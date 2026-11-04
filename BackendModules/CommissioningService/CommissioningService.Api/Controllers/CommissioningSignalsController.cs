using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Queries.GetCommissioningSignalLogs;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}/signals")]
public class CommissioningSignalsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningSignalsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CommissioningSignalResponse>>> GetSignalLogs(Guid sessionId)
    {
        var query = new GetCommissioningSignalLogsQuery(sessionId);
        var logs = await _mediator.Send(query);

        var response = new List<CommissioningSignalResponse>();
        foreach (var log in logs)
        {
            response.Add(new CommissioningSignalResponse
            {
                Id = log.Id,
                DeviceId = log.DeviceId,
                SignalType = log.SignalType,
                Payload = log.Payload,
                LoggedAt = log.LoggedAt
            });
        }

        return Ok(response);
    }
}