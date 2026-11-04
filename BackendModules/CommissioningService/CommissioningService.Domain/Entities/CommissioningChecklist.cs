using System;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.Entities;

public class CommissioningChecklist : Entity<Guid>
{
    public string Name { get; private set; }
    public bool IsCompleted { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // EF Core constructor
    private CommissioningChecklist() { }

    internal CommissioningChecklist(string name)
    {
        Id = Guid.NewGuid();
        Name = name;
        IsCompleted = false;
    }

    internal void MarkCompleted()
    {
        IsCompleted = true;
        CompletedAt = DateTime.UtcNow;
    }
}