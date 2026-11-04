using CommissioningService.Domain.Aggregates;
using CommissioningService.Domain.Exceptions;
using CommissioningService.Domain.Policies;
using CommissioningService.Domain.ValueObjects;

namespace CommissioningService.Domain.Services;

public class CommissioningCompletionDomainService
{
    /// <summary>
    /// Evaluates policies and transitions the session to Completed.
    /// </summary>
    public void CompleteSession(CommissioningSession session)
    {
        // 1. Evaluate the Completion Policy
        if (!CommissioningCompletionPolicy.CanComplete(session, out var completionReason))
        {
            throw new CommissioningSessionInvalidStateException(completionReason);
        }

        // 2. Transition state (raises CommissioningSessionCompletedEvent)
        session.FinishCommissioning();
    }

    /// <summary>
    /// Evaluates policies and transitions the session to Approved/Signed-off.
    /// </summary>
    public void ApproveSession(CommissioningSession session, string approvedBy)
    {
        // 1. Evaluate the Approval Policy
        if (!CommissioningApprovalPolicy.CanApprove(session, out var approvalReason))
        {
            throw new CommissioningSessionInvalidStateException(approvalReason);
        }

        // 2. Apply final approval (raises CommissioningSessionApprovedEvent)
        session.ApproveSession(approvedBy);
    }
}