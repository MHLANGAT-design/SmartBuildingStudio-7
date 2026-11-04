using System.Linq;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Policies;

public static class CommissioningCompletionPolicy
{
    /// <summary>
    /// Evaluates whether the commissioning session can be marked as completed.
    /// </summary>
    public static bool CanComplete(CommissioningSession session, out string reason)
    {
        reason = string.Empty;

        // 1. Must be in the Testing phase to be completed
        if (session.Status.Value != CommissioningStatus.StatusValue.Testing)
        {
            reason = $"Session must be in 'Testing' state to complete. Current state: {session.Status.Value}";
            return false;
        }

        // 2. Cannot complete if there are unresolved Critical defects
        var criticalDefects = session.Defects
            .Where(d => d.Status == DefectStatus.StatusValue.Open.ToString() && d.Severity == DefectSeverity.SeverityValue.Critical.ToString())
            .ToList();

        if (criticalDefects.Any())
        {
            reason = $"Cannot complete session with {criticalDefects.Count} open Critical defect(s).";
            return false;
        }

        // 3. Ensure all devices have an assigned address
        var unaddressedDevices = session.Devices.Where(d => !d.IsAddressed).ToList();
        if (unaddressedDevices.Any())
        {
            reason = $"Cannot complete session. {unaddressedDevices.Count} device(s) do not have an assigned address.";
            return false;
        }

        return true;
    }
}