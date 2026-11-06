using System;

namespace GatewayManagementService.Domain.Exceptions;

public sealed class GatewayNotFoundException : Exception
{
    public GatewayNotFoundException(Guid gatewayId)
        : base($"Gateway '{gatewayId}' was not found.") { }
}