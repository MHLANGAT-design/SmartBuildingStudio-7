using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class DaliProtocol : ValueObject
{
    public enum ProtocolValue
    {
        Dali2 = 0,
        Dali1Legacy = 1,
        DaliWireless = 2
    }

    public ProtocolValue Value { get; }

    public DaliProtocol(ProtocolValue value) => Value = value;

    public static DaliProtocol Dali2 => new(ProtocolValue.Dali2);
    public static DaliProtocol Dali1Legacy => new(ProtocolValue.Dali1Legacy);
    public static DaliProtocol DaliWireless => new(ProtocolValue.DaliWireless);

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}