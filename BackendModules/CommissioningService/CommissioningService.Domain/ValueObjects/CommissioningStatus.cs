using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class CommissioningStatus : ValueObject
{
    public enum StatusValue
    {
        Idle = 0,
        Discovering = 1,
        Addressing = 2,
        Testing = 3,
        Completed = 4,
        Failed = 5
    }

    public StatusValue Value { get; }

    public CommissioningStatus(StatusValue value) => Value = value;

    public static CommissioningStatus Idle => new(StatusValue.Idle);
    public static CommissioningStatus Discovering => new(StatusValue.Discovering);
    public static CommissioningStatus Addressing => new(StatusValue.Addressing);
    public static CommissioningStatus Testing => new(StatusValue.Testing);
    public static CommissioningStatus Completed => new(StatusValue.Completed);
    public static CommissioningStatus Failed => new(StatusValue.Failed);

    public bool IsTerminal() => Value == StatusValue.Completed || Value == StatusValue.Failed;

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}