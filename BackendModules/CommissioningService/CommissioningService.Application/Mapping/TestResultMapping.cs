using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Application.Mapping;

public static class TestResultMapping
{
    public static TestResultDto ToDto(this CommissioningTestResult result)
    {
        if (result == null) return null!;

        return new TestResultDto
        {
            Id = result.Id,
            TestId = result.TestId.Value, // FIX: Extract the Guid value
            DeviceId = result.DeviceId,
            Status = result.Status,
            ExpectedValue = result.ExpectedValue,
            ActualValue = result.ActualValue,
            DurationMs = result.DurationMs,
            ExecutedAt = result.ExecutedAt
        };
    }
}