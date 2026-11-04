using System;
using MediatR;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Commands.RunProgrammingDiagnostics;

public record RunProgrammingDiagnosticsCommand(
    Guid SessionId,
    string GatewayId,
    string LineId
) : IRequest<DiagnosticsReportDto>;