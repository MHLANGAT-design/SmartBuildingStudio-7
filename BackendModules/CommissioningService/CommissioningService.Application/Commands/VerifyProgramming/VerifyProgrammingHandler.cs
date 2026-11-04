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
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Commands.VerifyProgramming;

public class VerifyProgrammingHandler : IRequestHandler<VerifyProgrammingCommand, VerificationReportDto>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly IProgrammingVerificationProvider _verificationProvider;
    private readonly ILogger<VerifyProgrammingHandler> _logger;

    public VerifyProgrammingHandler(
        ICommissioningSessionRepository repository,
        IProgrammingVerificationProvider verificationProvider,
        ILogger<VerifyProgrammingHandler> logger)
    {
        _repository = repository;
        _verificationProvider = verificationProvider;
        _logger = logger;
    }

    public async Task<VerificationReportDto> Handle(VerifyProgrammingCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        _logger.LogInformation(
            "Starting verification for deployment {DeploymentId} on session {SessionId}",
            request.DeploymentId, request.SessionId);

        // Run the verification against the gateway (or mock)
        var report = await _verificationProvider.VerifyAsync(
            request.DeploymentId,
            request.ExpectedDevices,
            cancellationToken);

        return report;
    }
}