// GatewayManagementService.Application/Exceptions/GatewayOperationException.cs

namespace GatewayManagementService.Application.Exceptions;

public sealed class GatewayOperationException : GatewayApplicationException
{
    public GatewayOperationException(string message) : base(message) { }
    public GatewayOperationException(string message, Exception inner) : base(message, inner) { }
}