using System;
using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class CommissioningRevision : ValueObject
{
    public int Value { get; }

    public CommissioningRevision(int value)
    {
        if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "Revision cannot be negative.");
        Value = value;
    }

    public CommissioningRevision Increment() => new(Value + 1);

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}