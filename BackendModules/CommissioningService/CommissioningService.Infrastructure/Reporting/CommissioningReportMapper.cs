using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Aggregates;

namespace CommissioningService.Infrastructure.Reporting;

public class CommissioningReportMapper
{
    public CommissioningReportDto Map(CommissioningSession session)
    {
        return new CommissioningReportDto();
    }
}