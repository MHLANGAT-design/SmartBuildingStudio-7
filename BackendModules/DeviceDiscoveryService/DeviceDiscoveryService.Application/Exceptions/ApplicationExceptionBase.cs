// Exceptions/ApplicationExceptionBase.cs

namespace DeviceDiscoveryService.Application.Exceptions;

public abstract class ApplicationExceptionBase : Exception
{
    protected ApplicationExceptionBase(string message) : base(message) { }
    protected ApplicationExceptionBase(string message, Exception inner) : base(message, inner) { }
}