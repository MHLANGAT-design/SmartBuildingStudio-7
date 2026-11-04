using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using CommissioningService.Domain.Repositories;
using CommissioningService.Domain.ValueObjects;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Application.Interfaces;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Commands.RunProgrammingDiagnostics;

public class RunProgrammingDiagnosticsHandler : IRequestHandler<RunProgrammingDiagnosticsCommand, DiagnosticsReportDto>
{
    private readonly ICommissioningSessionRepository _repository;
    private readonly IProgrammingDiagnosticsProvider _diagnosticsProvider;
    private readonly ILogger<RunProgrammingDiagnosticsHandler> _logger;

    public RunProgrammingDiagnosticsHandler(
        ICommissioningSessionRepository repository,
        IProgrammingDiagnosticsProvider diagnosticsProvider,
        ILogger<RunProgrammingDiagnosticsHandler> logger)
    {
        _repository = repository;
        _diagnosticsProvider = diagnosticsProvider;
        _logger = logger;
    }

    public async Task<DiagnosticsReportDto> Handle(RunProgrammingDiagnosticsCommand request, CancellationToken cancellationToken)
    {
        var session = await _repository.GetByIdAsync(new CommissioningSessionId(request.SessionId));
        if (session == null) throw new CommissioningSessionNotFoundException(request.SessionId);

        _logger.LogInformation(
            "Starting diagnostics for gateway {GatewayId} line {LineId} on session {SessionId}",
            request.GatewayId, request.LineId, request.SessionId);

        return await _diagnosticsProvider.RunDiagnosticsAsync(
            request.GatewayId,
            request.LineId,
            cancellationToken);
    }
}