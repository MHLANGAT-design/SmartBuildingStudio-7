using System;
using System.Linq;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.Entities;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Services;

public class CommissioningDefectDomainService
{
    /// <summary>
    /// Raises a new defect against the session.
    /// </summary>
    public void RaiseDefect(CommissioningSession session, string targetId, string category, string description, string severity)
    {
        if (session.Status.Value == CommissioningStatus.StatusValue.Completed)
        {
            throw new CommissioningSessionInvalidStateException("Cannot raise defects on a completed session.");
        }

        var validSeverities = new[] { "LOW", "MEDIUM", "HIGH", "CRITICAL" };
        if (!validSeverities.Contains(severity.ToUpperInvariant()))
        {
            throw new ArgumentException($"Invalid severity: {severity}");
        }

        session.RegisterDefect(targetId, category, description, severity.ToUpperInvariant());
    }

    /// <summary>
    /// Resolves an existing defect.
    /// </summary>
    public void ResolveDefect(CommissioningSession session, Guid defectId, string resolvedBy)
    {
        var defect = session.Defects.FirstOrDefault(d => d.Id == defectId);
        if (defect == null)
        {
            throw new KeyNotFoundException($"Defect with ID '{defectId}' not found in this session.");
        }

        if (defect.Status == "RESOLVED")
        {
            return; // Idempotent resolution
        }

        session.ResolveDefect(defect, resolvedBy);
    }

    /// <summary>
    /// Checks if there are any critical defects preventing session progression.
    /// </summary>
    public void EnsureNoBlockingDefects(CommissioningSession session)
    {
        var criticalOpenDefects = session.Defects
            .Where(d => d.Status == "OPEN" && d.Severity == "CRITICAL")
            .ToList();

        if (criticalOpenDefects.Any())
        {
            throw new CommissioningConflictException(
                $"Cannot proceed. There are {criticalOpenDefects.Count} unresolved CRITICAL defects.");
        }
    }
}