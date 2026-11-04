using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Responses;
using CommissioningService.Application.Queries.GetCommissioningReport;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning")]
public class CommissioningReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningReportsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("report")]
    public async Task<ActionResult<CommissioningReportResponse>> GenerateReport([FromBody] Guid sessionId)
    {
        var query = new GetCommissioningReportQuery(sessionId);
        var report = await _mediator.Send(query);

        return Ok(new CommissioningReportResponse
        {
            ReportId = report.ReportId,
            SessionId = report.SessionId,
            GeneratedAt = report.GeneratedAt,
            OverallStatus = report.OverallStatus,
            TotalDevices = report.TotalDevices,
            PassedDevices = report.PassedDevices,
            FailedDevices = report.FailedDevices
        });
    }

    [HttpGet("session/{sessionId:guid}/report")]
    public async Task<ActionResult<CommissioningReportResponse>> GetReport(Guid sessionId)
    {
        var query = new GetCommissioningReportQuery(sessionId);
        var report = await _mediator.Send(query);

        return Ok(new CommissioningReportResponse
        {
            ReportId = report.ReportId,
            SessionId = report.SessionId,
            GeneratedAt = report.GeneratedAt,
            OverallStatus = report.OverallStatus,
            TotalDevices = report.TotalDevices,
            PassedDevices = report.PassedDevices,
            FailedDevices = report.FailedDevices
        });
    }
}