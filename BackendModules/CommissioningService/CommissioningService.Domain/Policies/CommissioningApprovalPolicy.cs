using System.Linq;
using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Policies;

public static class CommissioningApprovalPolicy
{
    /// <summary>
    /// Evaluates whether the session is ready for final sign-off/approval.
    /// </summary>
    public static bool CanApprove(CommissioningSession session, out string reason)
    {
        reason = string.Empty;

        // 1. Must be in the Completed phase
        if (session.Status.Value != CommissioningStatus.StatusValue.Completed)
        {
            reason = "Session must be Completed before it can be Approved.";
            return false;
        }

        // 2. Must have no unresolved defects of any severity (High, Medium, or Low)
        var openDefects = session.Defects.Where(d => d.Status == DefectStatus.StatusValue.Open.ToString()).ToList();
        if (openDefects.Any())
        {
            reason = $"Cannot approve session with {openDefects.Count} unresolved defect(s). Resolve all faults first.";
            return false;
        }

        // 3. (Optional) Must have at least one device discovered
        if (!session.Devices.Any())
        {
            reason = "Cannot approve an empty session with no discovered devices.";
            return false;
        }

        return true;
    }
}