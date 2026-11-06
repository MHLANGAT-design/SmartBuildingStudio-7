using System;
using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class GatewayIdentifier : ValueObject
{
    public string Value { get; }

    public GatewayIdentifier(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Gateway identifier cannot be empty.", nameof(value));
        if (value.Length > 128)
            throw new ArgumentException("Gateway identifier cannot exceed 128 characters.", nameof(value));
        Value = value.Trim();
    }

    public override string ToString() => Value;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}