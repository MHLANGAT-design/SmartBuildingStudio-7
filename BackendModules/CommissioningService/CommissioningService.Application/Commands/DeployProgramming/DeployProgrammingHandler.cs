using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;

namespace CommissioningService.Application.Commands.DeployProgramming;

public class DeployProgrammingHandler : IRequestHandler<DeployProgrammingCommand, DeployProgrammingResult>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly IGatewayProgrammingProvider _programmingProvider;
    private readonly ICommissioningAuditService _auditService;
    private readonly ILogger<DeployProgrammingHandler> _logger;

    public DeployProgrammingHandler(
        ICommissioningSessionRepository repository,
        IGatewayProgrammingProvider programmingProvider,
        ICommissioningAuditService auditService,
        ILogger<DeployProgrammingHandler> logger)
    {
        _repository = repository;
        _programmingProvider = programmingProvider;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<DeployProgrammingResult> Handle(
        DeployProgrammingCommand request,
        CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        var deploymentId = $"deploy_{Guid.NewGuid():N}";
        _logger.LogInformation(
            "Starting deployment {DeploymentId} for session {SessionId} — {SequenceCount} sequences, plan {PlanId}",
            deploymentId, request.SessionId, request.Sequences.Count, request.PlanId);

        // Run every sequence through the gateway
        var result = await _programmingProvider.DeployPlanAsync(
            gatewayId: request.GatewayId,
            targetLineId: request.TargetLineId,
            deploymentId: deploymentId,
            sequences: request.Sequences,
            cancellationToken: cancellationToken);

        // Audit log
        await _auditService.LogActionAsync(
            request.SessionId,
            action: "ProgrammingDeployment",
            performedBy: "current-user",
            details: $"Plan {request.PlanId}: {result.CommandsSent} sent, {result.CommandsFailed} failed.",
            cancellationToken: cancellationToken);

        if (!result.Success)
        {
            _logger.LogWarning(
                "Deployment {DeploymentId} failed after {Failed} command failures: {Error}",
                deploymentId, result.CommandsFailed, result.ErrorMessage);
        }
        else
        {
            _logger.LogInformation(
                "Deployment {DeploymentId} succeeded — {CommandsSent} commands sent",
                deploymentId, result.CommandsSent);
        }

        return result with { DeploymentId = deploymentId };
    }
}