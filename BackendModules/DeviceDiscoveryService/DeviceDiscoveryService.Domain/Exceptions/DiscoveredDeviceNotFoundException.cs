// Exceptions/DiscoveredDeviceNotFoundException.cs

using System;

namespace DeviceDiscoveryService.Domain.Exceptions;

public sealed class DiscoveredDeviceNotFoundException : Exception
{
    public Guid DeviceId { get; }

    public DiscoveredDeviceNotFoundException(Guid deviceId)
        : base($"Discovered device '{deviceId}' was not found in the session.")
    {
        DeviceId = deviceId;
    }
}