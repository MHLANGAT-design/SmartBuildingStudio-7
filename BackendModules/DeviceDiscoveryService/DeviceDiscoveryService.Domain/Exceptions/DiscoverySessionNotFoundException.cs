// Exceptions/DiscoverySessionNotFoundException.cs

using System;

namespace DeviceDiscoveryService.Domain.Exceptions;

public sealed class DiscoverySessionNotFoundException : Exception
{
    public Guid SessionId { get; }

    public DiscoverySessionNotFoundException(Guid sessionId)
        : base($"Discovery session '{sessionId}' was not found.")
    {
        SessionId = sessionId;
    }
}