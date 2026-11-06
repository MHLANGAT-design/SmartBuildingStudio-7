using System;

namespace GatewayManagementService.Domain.Exceptions;

public sealed class GatewayConnectionException : Exception
{
    public GatewayConnectionException(string message) : base(message) { }
    public GatewayConnectionException(string message, Exception inner) : base(message, inner) { }
}