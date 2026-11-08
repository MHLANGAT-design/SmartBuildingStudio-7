// Exceptions/DeviceMatchConflictException.cs

using System;

namespace DeviceDiscoveryService.Domain.Exceptions;

public sealed class DeviceMatchConflictException : Exception
{
    public DeviceMatchConflictException(string message) : base(message) { }
}