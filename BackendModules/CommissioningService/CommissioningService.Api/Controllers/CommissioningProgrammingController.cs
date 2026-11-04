using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using CommissioningService.Api.Contracts.Requests;
using CommissioningService.Application.Commands.DeployProgramming;
using CommissioningService.Application.Commands.VerifyProgramming;
using CommissioningService.Application.Commands.RunProgrammingDiagnostics;

namespace CommissioningService.Api.Controllers;

[ApiController]
[Route("api/commissioning/session/{sessionId:guid}/programming")]
public class CommissioningProgrammingController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissioningProgrammingController(IMediator mediator) => _mediator = mediator;

    [HttpPost("deploy")]
    public async Task<ActionResult<object>> Deploy(Guid sessionId, [FromBody] DeployProgrammingRequest request)
    {
        var sequences = request.Sequences.Select(s => new ProgrammingSequence(
            SequenceId: s.SequenceId,
            DeviceId: s.DeviceId,
            Address: s.Address,
            Commands: s.Commands.Select(c => new ProgrammingCommand(
                CommandType: c.CommandType,
                Parameter1: c.Parameter1,
                Parameter2: c.Parameter2,
                FadeTime: c.FadeTime
            )).ToList()
        )).ToList();

        var command = new DeployProgrammingCommand(
            SessionId: sessionId,
            PlanId: request.PlanId,
            DesignRevisionId: request.DesignRevisionId,
            GatewayId: request.GatewayId,
            TargetLineId: request.TargetLineId,
            Sequences: sequences
        );

        var result = await _mediator.Send(command);

        return Ok(new
        {
            deploymentId = result.DeploymentId,
            success = result.Success,
            commandsSent = result.CommandsSent,
            commandsFailed = result.CommandsFailed,
            errorMessage = result.ErrorMessage
        });
    }

    [HttpPost("verify")]
    public async Task<ActionResult<object>> Verify(Guid sessionId, [FromBody] VerifyProgrammingRequest request)
    {
        var devices = request.ExpectedDevices.Select(d => new VerificationDeviceDto(
            DeviceId: d.DeviceId,
            HardwareAddress: d.HardwareAddress,
            DeviceType: d.DeviceType,
            Groups: d.Groups,
            Scenes: d.Scenes.Select(s => new SceneLevelDto(s.SceneId, s.Level)).ToList()
        )).ToList();

        var command = new VerifyProgrammingCommand(sessionId, request.DeploymentId, devices);
        var report = await _mediator.Send(command);

        return Ok(report);
    }

    [HttpPost("diagnostics")]
    public async Task<ActionResult<object>> RunDiagnostics(Guid sessionId, [FromBody] RunDiagnosticsRequest request)
    {
        var command = new RunProgrammingDiagnosticsCommand(sessionId, request.GatewayId, request.LineId);
        var report = await _mediator.Send(command);

        return Ok(report);
    }
}