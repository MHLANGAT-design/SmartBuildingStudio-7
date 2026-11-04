using System;
using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class CommissioningSessionId : ValueObject
{
    public Guid Value { get; }

    public CommissioningSessionId(Guid value) => Value = value;

    public static CommissioningSessionId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}