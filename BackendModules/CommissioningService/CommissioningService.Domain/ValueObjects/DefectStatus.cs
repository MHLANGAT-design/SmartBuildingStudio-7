using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class DefectStatus : ValueObject
{
    public enum StatusValue
    {
        Open = 0,
        InProgress = 1,
        Resolved = 2,
        Ignored = 3
    }

    public StatusValue Value { get; }

    public DefectStatus(StatusValue value) => Value = value;

    public static DefectStatus Open => new(StatusValue.Open);
    public static DefectStatus InProgress => new(StatusValue.InProgress);
    public static DefectStatus Resolved => new(StatusValue.Resolved);
    public static DefectStatus Ignored => new(StatusValue.Ignored);

    public bool IsActive() => Value == StatusValue.Open || Value == StatusValue.InProgress;

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}