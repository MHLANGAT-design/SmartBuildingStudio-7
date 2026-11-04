using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.Interfaces;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Integrations.ReportsIntegration;

public class CommissioningReportProvider : ICommissioningReportService
{
    public Task<CommissioningReportDto> GenerateReportAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new CommissioningReportDto());
    }

    public Task<byte[]> ExportReportToPdfAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new byte[0]);
    }
}