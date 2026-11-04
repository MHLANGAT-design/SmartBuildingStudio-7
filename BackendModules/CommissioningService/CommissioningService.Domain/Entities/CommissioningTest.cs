using System;
using System.Collections.Generic;
using CommissioningService.Domain.Common;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Entities;

public class CommissioningTest : Entity<CommissioningTestId>
{
    // Backing field for EF Core
    private readonly List<CommissioningTestResult> _results = new();

    public string TestType { get; private set; } = string.Empty;
    public string TargetId { get; private set; } = string.Empty;
    public string Status { get; private set; } = "PENDING";
    public DateTime StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // FIX: Added the missing Results property
    public IReadOnlyCollection<CommissioningTestResult> Results => _results.AsReadOnly();

    // EF Core constructor
    private CommissioningTest() { }

    internal CommissioningTest(CommissioningTestId id, string testType, string targetId)
    {
        Id = id;
        TestType = testType;
        TargetId = targetId;
        Status = "PENDING";
        StartedAt = DateTime.UtcNow;
    }

    internal void MarkRunning()
    {
        Status = "RUNNING";
    }

    internal void MarkCompleted()
    {
        Status = "COMPLETED";
        CompletedAt = DateTime.UtcNow;
    }

    // FIX: Added the missing method to add results
    internal void AddResult(CommissioningTestResult result)
    {
        _results.Add(result);
    }
}