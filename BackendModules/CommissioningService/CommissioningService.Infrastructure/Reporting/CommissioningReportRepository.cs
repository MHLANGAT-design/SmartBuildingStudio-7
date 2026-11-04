using System;
using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Reporting;

public class CommissioningReportRepository
{
    public Task SaveReportAsync(CommissioningReportDto report, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}