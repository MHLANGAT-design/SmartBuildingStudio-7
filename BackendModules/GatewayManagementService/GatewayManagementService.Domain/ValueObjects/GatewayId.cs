using System;
using System.Collections.Generic;
using GatewayManagementService.Domain.Common;

namespace GatewayManagementService.Domain.ValueObjects;

public sealed class GatewayId : ValueObject
{
    public Guid Value { get; }

    public GatewayId(Guid value) => Value = value;

    public static GatewayId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}