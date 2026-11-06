using System;
using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class GatewayConfiguration : ValueObject
{
    public int DaliLineCount { get; }
    public int PollingIntervalSeconds { get; }
    public int CommandTimeoutSeconds { get; }
    public string? AuthToken { get; }

    public GatewayConfiguration(
        int daliLineCount,
        int pollingIntervalSeconds,
        int commandTimeoutSeconds,
        string? authToken = null)
    {
        if (daliLineCount < 1 || daliLineCount > 64)
            throw new ArgumentOutOfRangeException(nameof(daliLineCount), "DaliLineCount must be between 1 and 64.");
        if (pollingIntervalSeconds < 1)
            throw new ArgumentOutOfRangeException(nameof(pollingIntervalSeconds), "Polling interval must be positive.");
        if (commandTimeoutSeconds < 1)
            throw new ArgumentOutOfRangeException(nameof(commandTimeoutSeconds), "Command timeout must be positive.");

        DaliLineCount = daliLineCount;
        PollingIntervalSeconds = pollingIntervalSeconds;
        CommandTimeoutSeconds = commandTimeoutSeconds;
        AuthToken = authToken;
    }

    public static GatewayConfiguration Default() => new(2, 15, 30);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return DaliLineCount;
        yield return PollingIntervalSeconds;
        yield return CommandTimeoutSeconds;
        yield return AuthToken ?? string.Empty;
    }
}