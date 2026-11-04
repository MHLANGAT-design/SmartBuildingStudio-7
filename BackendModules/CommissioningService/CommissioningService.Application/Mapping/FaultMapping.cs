using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Application.Mapping;

public static class FaultMapping
{
    public static FaultDto ToDto(this CommissioningDefect defect)
    {
        if (defect == null) return null!;

        return new FaultDto
        {
            Id = defect.Id,
            FaultId = defect.FaultId,
            Category = defect.Category,
            Description = defect.Description,
            Severity = defect.Severity,
            Status = defect.Status,
            DetectedAt = defect.DetectedAt
        };
    }
}