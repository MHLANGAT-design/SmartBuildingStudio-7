using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class CommissioningDefect : Entity<Guid>
{
    public string FaultId { get; private set; }
    public string Category { get; private set; }
    public string Description { get; private set; }
    public string Severity { get; private set; }
    public string Status { get; private set; }
    public DateTime DetectedAt { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public string? ResolvedBy { get; private set; }

    // EF Core constructor
    private CommissioningDefect() { }

    internal CommissioningDefect(string faultId, string category, string description, string severity)
    {
        Id = Guid.NewGuid();
        FaultId = faultId;
        Category = category;
        Description = description;
        Severity = severity;
        Status = "OPEN";
        DetectedAt = DateTime.UtcNow;
    }

    internal void Resolve(string resolvedBy)
    {
        Status = "RESOLVED";
        ResolvedAt = DateTime.UtcNow;
        ResolvedBy = resolvedBy;
    }
}