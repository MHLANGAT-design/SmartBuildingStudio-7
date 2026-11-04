using System;
using System.Collections.Generic;
using CommissioningService.Domain.Common;

namespace CommissioningService.Domain.ValueObjects;

public sealed class DeviceAddress : ValueObject
{
    public int Value { get; }

    public DeviceAddress(int value)
    {
        // DALI addresses are strictly 0-63
        if (value < 0 || value > 63)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "DALI address must be between 0 and 63.");
        }
        Value = value;
    }

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}