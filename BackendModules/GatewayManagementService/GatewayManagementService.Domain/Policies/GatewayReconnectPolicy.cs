using System;

namespace GatewayManagementService.Domain.Policies;

public sealed class GatewayReconnectPolicy
{
    public int MaxAttempts { get; }
    public TimeSpan InitialDelay { get; }
    public double BackoffMultiplier { get; }

    public GatewayReconnectPolicy(int maxAttempts, TimeSpan initialDelay, double backoffMultiplier)
    {
        if (maxAttempts < 1) throw new ArgumentOutOfRangeException(nameof(maxAttempts));
        if (initialDelay <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(initialDelay));
        if (backoffMultiplier < 1.0) throw new ArgumentOutOfRangeException(nameof(backoffMultiplier));
        MaxAttempts = maxAttempts;
        InitialDelay = initialDelay;
        BackoffMultiplier = backoffMultiplier;
    }

    public static GatewayReconnectPolicy Default() => new(5, TimeSpan.FromSeconds(2), 2.0);

    public TimeSpan DelayFor(int attemptNumber)
    {
        if (attemptNumber < 1) attemptNumber = 1;
        var ms = InitialDelay.TotalMilliseconds * Math.Pow(BackoffMultiplier, attemptNumber - 1);
        return TimeSpan.FromMilliseconds(ms);
    }
}