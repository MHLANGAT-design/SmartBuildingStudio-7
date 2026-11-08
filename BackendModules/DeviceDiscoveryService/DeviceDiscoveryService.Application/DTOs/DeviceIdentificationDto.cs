// DTOs/DeviceIdentificationDto.cs

namespace DeviceDiscoveryService.Application.DTOs;

public sealed class DeviceIdentificationDto
{
    public Guid Id { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Gtin { get; init; }
    public string? Manufacturer { get; init; }
    public string? Model { get; init; }
    public string? FirmwareVersion { get; init; }
    public string? SerialNumber { get; init; }
    public string? DeviceType { get; init; }
    public DateTime IdentifiedAt { get; init; }
}