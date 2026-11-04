using System.Threading;
using System.Threading.Tasks;
using CommissioningService.Application.DTOs;

namespace CommissioningService.Infrastructure.Reporting;

public class CommissioningReportExporter
{
    public Task<byte[]> ExportToPdfAsync(CommissioningReportDto report, CancellationToken cancellationToken)
    {
        return Task.FromResult(new byte[0]);
    }
}