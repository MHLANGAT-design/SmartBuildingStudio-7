using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class TransportProtocol : ValueObject
{
    public enum ProtocolValue
    {
        Http = 0,
        Tcp = 1,
        WebSocket = 2
    }

    public ProtocolValue Value { get; }

    public TransportProtocol(ProtocolValue value) => Value = value;

    public static TransportProtocol Http => new(ProtocolValue.Http);
    public static TransportProtocol Tcp => new(ProtocolValue.Tcp);
    public static TransportProtocol WebSocket => new(ProtocolValue.WebSocket);

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}