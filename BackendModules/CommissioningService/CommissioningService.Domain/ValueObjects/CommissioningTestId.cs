using System;
using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class CommissioningTestId : ValueObject
{
    public Guid Value { get; }

    public CommissioningTestId(Guid value) => Value = value;

    public static CommissioningTestId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}