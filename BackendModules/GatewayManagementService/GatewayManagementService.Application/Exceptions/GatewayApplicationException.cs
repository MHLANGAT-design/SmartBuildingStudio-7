// GatewayManagementService.Application/Exceptions/GatewayApplicationException.cs

namespace GatewayManagementService.Application.Exceptions;

public class GatewayApplicationException : Exception
{
    public GatewayApplicationException(string message) : base(message) { }
    public GatewayApplicationException(string message, Exception inner) : base(message, inner) { }
}