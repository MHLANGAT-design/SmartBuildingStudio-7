using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Policies;

public static class CommissioningTestPolicy
{
    /// <summary>
    /// Evaluates whether a test can be executed based on the session's current state and progress.
    /// </summary>
    public static bool CanRunTest(CommissioningSession session, string testType, out string reason)
    {
        reason = string.Empty;

        // 1. Cannot run tests if the session is Idle or already Completed
        if (session.Status.Value == CommissioningStatus.StatusValue.Idle)
        {
            reason = "Cannot run tests before device discovery has started.";
            return false;
        }

        if (session.Status.Value == CommissioningStatus.StatusValue.Completed)
        {
            reason = "Cannot run tests on a session that has already been completed.";
            return false;
        }

        // 2. Cannot run tests if there are no devices
        if (!session.Devices.Any())
        {
            reason = "No devices available to test. Run discovery first.";
            return false;
        }

        // 3. Rule based on test type (example)
        if (testType.ToUpperInvariant() == "SCENE")
        {
            // Scene tests require addressing to be complete
            var unaddressed = session.Devices.Any(d => !d.IsAddressed);
            if (unaddressed)
            {
                reason = "Cannot run Scene tests until all devices are addressed.";
                return false;
            }
        }

        return true;
    }
}