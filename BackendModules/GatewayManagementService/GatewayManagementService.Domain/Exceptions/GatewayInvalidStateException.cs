using System;

namespace GatewayManagementService.Domain.Exceptions;

public sealed class GatewayInvalidStateException : Exception
{
    public GatewayInvalidStateException(string message) : base(message) { }
}