using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class ConnectionStatus : ValueObject
{
    public enum StatusValue
    {
        Disconnected = 0,
        Connecting = 1,
        Connected = 2,
        Reconnecting = 3,
        Error = 4
    }

    public StatusValue Value { get; }

    public ConnectionStatus(StatusValue value) => Value = value;

    public static ConnectionStatus Disconnected => new(StatusValue.Disconnected);
    public static ConnectionStatus Connecting => new(StatusValue.Connecting);
    public static ConnectionStatus Connected => new(StatusValue.Connected);
    public static ConnectionStatus Reconnecting => new(StatusValue.Reconnecting);
    public static ConnectionStatus Error => new(StatusValue.Error);

    public bool IsActive() => Value == StatusValue.Connected;
    public bool IsTransitioning() => Value == StatusValue.Connecting || Value == StatusValue.Reconnecting;
    public bool IsFailed() => Value == StatusValue.Error;

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}