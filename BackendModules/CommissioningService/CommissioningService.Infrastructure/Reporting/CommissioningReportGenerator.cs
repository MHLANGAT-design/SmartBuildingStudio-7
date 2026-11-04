using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Reporting;

public class CommissioningReportGenerator
{
    public Task<CommissioningReportDto> GenerateReportModelAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        return Task.FromResult(new CommissioningReportDto());
    }
}