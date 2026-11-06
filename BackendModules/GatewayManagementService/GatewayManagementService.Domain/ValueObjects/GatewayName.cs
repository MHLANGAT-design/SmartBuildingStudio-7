using System;
using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class GatewayName : ValueObject
{
    public string Value { get; }

    public GatewayName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Gateway name cannot be empty.", nameof(value));
        if (value.Length > 200)
            throw new ArgumentException("Gateway name cannot exceed 200 characters.", nameof(value));
        Value = value.Trim();
    }

    public override string ToString() => Value;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}