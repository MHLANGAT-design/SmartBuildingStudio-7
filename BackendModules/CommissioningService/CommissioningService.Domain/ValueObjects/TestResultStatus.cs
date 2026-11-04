using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class TestResultStatus : ValueObject
{
    public enum ResultValue
    {
        Unknown = 0,
        Passed = 1,
        Failed = 2,
        Warning = 3,
        Skipped = 4
    }

    public ResultValue Value { get; }

    public TestResultStatus(ResultValue value) => Value = value;

    public static TestResultStatus Passed => new(ResultValue.Passed);
    public static TestResultStatus Failed => new(ResultValue.Failed);
    public static TestResultStatus Unknown => new(ResultValue.Unknown);

    public bool IsSuccess() => Value == ResultValue.Passed || Value == ResultValue.Warning;

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}