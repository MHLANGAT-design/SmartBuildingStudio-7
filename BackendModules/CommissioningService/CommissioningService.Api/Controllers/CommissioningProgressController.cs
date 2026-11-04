using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Queries.GetCommissioningProgress;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}/progress")]
public class CommissioningProgressController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningProgressController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<CommissioningProgressResponse>> GetProgress(Guid sessionId)
    {
        var query = new GetCommissioningProgressQuery(sessionId);
        var progress = await _mediator.Send(query);

        return Ok(new CommissioningProgressResponse
        {
            SessionId = progress.SessionId,
            Status = progress.Status,
            TotalDevices = progress.TotalDevices,
            AddressedDevices = progress.AddressedDevices,
            TestedDevices = progress.TestedDevices,
            OpenDefects = progress.OpenDefects,
            ProgressPercentage = progress.ProgressPercentage
        });
    }
}