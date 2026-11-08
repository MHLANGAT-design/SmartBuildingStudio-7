// Entities/DeviceIdentification.cs

namespace DeviceDiscoveryService.Domain.Entities;

public sealed class DeviceIdentification
{
    public DeviceIdentificationId Id { get; private set; }
    public IdentificationStatus Status { get; private set; }

    public string? Gtin { get; private set; }
    public string? Manufacturer { get; private set; }
    public string? Model { get; private set; }
    public string? FirmwareVersion { get; private set; }
    public string? SerialNumber { get; private set; }
    public string? DeviceType { get; private set; }

    public DateTime IdentifiedAt { get; private set; }

    private DeviceIdentification(
        DeviceIdentificationId id,
        IdentificationStatus status,
        DateTime identifiedAt)
    {
        Id = id;
        Status = status;
        IdentifiedAt = identifiedAt;
    }

    public static DeviceIdentification Create(
        IdentificationStatus status,
        DateTime identifiedAt,
        string? gtin = null,
        string? manufacturer = null,
        string? model = null,
        string? firmwareVersion = null,
        string? serialNumber = null,
        string? deviceType = null)
    {
        return new DeviceIdentification(DeviceIdentificationId.New(), status, identifiedAt)
        {
            Gtin = gtin,
            Manufacturer = manufacturer,
            Model = model,
            FirmwareVersion = firmwareVersion,
            SerialNumber = serialNumber,
            DeviceType = deviceType,
        };
    }

    // EF Core
    private DeviceIdentification() { }
}