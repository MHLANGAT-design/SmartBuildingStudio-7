using System;

namespace CommissioningService.Domain.Exceptions;

public class CommissioningDeviceNotFoundException : Exception
{
    public string DeviceId { get; }

    public CommissioningDeviceNotFoundException(string deviceId)
        : base($"Device with external ID '{deviceId}' was not found in the current commissioning session.")
    {
        DeviceId = deviceId;
    }
}