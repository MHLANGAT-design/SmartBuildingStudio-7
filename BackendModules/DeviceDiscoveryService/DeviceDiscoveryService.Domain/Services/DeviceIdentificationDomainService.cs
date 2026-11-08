// Services/DeviceIdentificationDomainService.cs

using DeviceDiscoveryService.Domain.Entities;
using DeviceDiscoveryService.Domain.Policies;

namespace DeviceDiscoveryService.Domain.Services;

public sealed class DeviceIdentificationDomainService : IDeviceIdentificationDomainService
{
    public DeviceIdentification BuildIdentification(
        string? gtin,
        string? manufacturer,
        string? model,
        string? firmwareVersion,
        string? serialNumber,
        string? deviceType,
        DateTime identifiedAt)
    {
        var status = IdentificationPolicy.Evaluate(gtin, manufacturer, model, firmwareVersion);
        return DeviceIdentification.Create(
            status,
            identifiedAt,
            gtin: gtin,
            manufacturer: manufacturer,
            model: model,
            firmwareVersion: firmwareVersion,
            serialNumber: serialNumber,
            deviceType: deviceType);
    }
}