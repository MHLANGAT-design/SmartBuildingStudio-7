// Contracts/Requests/IdentifyDeviceRequest.cs

namespace DeviceDiscoveryService.Api.Contracts.Requests;

public sealed class IdentifyDeviceRequest
{
    public string? Gtin { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? FirmwareVersion { get; set; }
    public string? SerialNumber { get; set; }
    public string? DeviceType { get; set; }
}