// Exceptions/DiscoverySessionInvalidStateException.cs

using System;

namespace DeviceDiscoveryService.Domain.Exceptions;

public sealed class DiscoverySessionInvalidStateException : Exception
{
    public DiscoverySessionInvalidStateException(string message) : base(message) { }
    public DiscoverySessionInvalidStateException(string message, Exception inner) : base(message, inner) { }
}