using System;
using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class CommissioningDeviceId : ValueObject
{
    public Guid Value { get; }

    public CommissioningDeviceId(Guid value) => Value = value;

    public static CommissioningDeviceId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}