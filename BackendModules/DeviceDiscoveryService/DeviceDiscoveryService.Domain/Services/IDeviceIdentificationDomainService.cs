// Services/IDeviceIdentificationDomainService.cs

using DeviceDiscoveryService.Domain.Entities;

namespace DeviceDiscoveryService.Domain.Services;

public interface IDeviceIdentificationDomainService
{
    /// <summary>
    /// Given the raw fields the gateway returned for a discovered device,
    /// produce a fully-formed identification (status + fields + timestamp).
    /// Pure domain operation — no I/O.
    /// </summary>
    DeviceIdentification BuildIdentification(
        string? gtin,
        string? manufacturer,
        string? model,
        string? firmwareVersion,
        string? serialNumber,
        string? deviceType,
        DateTime identifiedAt);
}