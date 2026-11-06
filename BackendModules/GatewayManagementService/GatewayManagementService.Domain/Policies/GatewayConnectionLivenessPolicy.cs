using System;

namespace GatewayManagementService.Domain.Policies;

public sealed class GatewayConnectionLivenessPolicy
{
    public TimeSpan UnreachableThreshold { get; }

    public GatewayConnectionLivenessPolicy(TimeSpan unreachableThreshold)
    {
        if (unreachableThreshold <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(unreachableThreshold));
        UnreachableThreshold = unreachableThreshold;
    }

    public static GatewayConnectionLivenessPolicy Default() => new(TimeSpan.FromMinutes(2));

    public bool IsStale(DateTime? lastSeenAt, DateTime now)
    {
        if (!lastSeenAt.HasValue) return true;
        return now - lastSeenAt.Value > UnreachableThreshold;
    }
}