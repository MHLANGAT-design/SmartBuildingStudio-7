using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Application.Interfaces;

public interface IProgrammingDiagnosticsProvider
{
    Task<DiagnosticsReportDto> RunDiagnosticsAsync(
        string gatewayId,
        string lineId,
        CancellationToken cancellationToken = default);
}