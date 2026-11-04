using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class DefectSeverity : ValueObject
{
    public enum SeverityValue
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Critical = 3
    }

    public SeverityValue Value { get; }

    public DefectSeverity(SeverityValue value) => Value = value;

    public static DefectSeverity Low => new(SeverityValue.Low);
    public static DefectSeverity Medium => new(SeverityValue.Medium);
    public static DefectSeverity High => new(SeverityValue.High);
    public static DefectSeverity Critical => new(SeverityValue.Critical);

    public bool IsBlocking() => Value == SeverityValue.Critical;

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}