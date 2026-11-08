// Mapping/DiscoveredDeviceMappingProfile.cs

using DeviceDiscoveryService.Application.DTOs;
using DeviceDiscoveryService.Domain.Entities;

namespace DeviceDiscoveryService.Application.Mapping;

public static class DiscoveredDeviceMappingProfile
{
    public static DiscoveredDeviceDto ToDto(this DiscoveredDevice device)
    {
        if (device is null) throw new ArgumentNullException(nameof(device));

        return new DiscoveredDeviceDto
        {
            Id = device.Id.Value,
            ExternalId = device.ExternalId,
            LineId = device.Address.LineId,
            ShortAddress = device.Address.ShortAddress,
            IsOnline = device.IsOnline,
            FirstSeenAt = device.FirstSeenAt,
            LastSeenAt = device.LastSeenAt,
            Identification = device.Identification?.ToDto(),
            Match = device.Match?.ToDto(),
        };
    }

    public static DeviceIdentificationDto ToDto(this DeviceIdentification ident) => new()
    {
        Id = ident.Id.Value,
        Status = ident.Status.Value.ToString(),
        Gtin = ident.Gtin,
        Manufacturer = ident.Manufacturer,
        Model = ident.Model,
        FirmwareVersion = ident.FirmwareVersion,
        SerialNumber = ident.SerialNumber,
        DeviceType = ident.DeviceType,
        IdentifiedAt = ident.IdentifiedAt,
    };

    public static DeviceMatchDto ToDto(this DeviceMatch match) => new()
    {
        Id = match.Id.Value,
        DeviceId = match.DeviceId.Value,
        FixtureId = match.FixtureId,
        Status = match.Status.Value.ToString(),
        Confidence = match.Confidence,
        Discrepancies = match.Discrepancies.ToList(),
        MatchedAt = match.MatchedAt,
    };
}