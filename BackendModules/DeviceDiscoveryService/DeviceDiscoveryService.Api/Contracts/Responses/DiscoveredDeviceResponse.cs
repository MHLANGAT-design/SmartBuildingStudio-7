// Contracts/Responses/DiscoveredDeviceResponse.cs

using DeviceDiscoveryService.Application.DTOs;

namespace DeviceDiscoveryService.Api.Contracts.Responses;

public sealed class DiscoveredDeviceResponse
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public string LineId { get; set; } = string.Empty;
    public int? ShortAddress { get; set; }
    public bool IsOnline { get; set; }
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public DeviceIdentificationResponse? Identification { get; set; }
    public DeviceMatchResponse? Match { get; set; }

    public static DiscoveredDeviceResponse FromDto(DiscoveredDeviceDto dto) => new()
    {
        Id = dto.Id,
        ExternalId = dto.ExternalId,
        LineId = dto.LineId,
        ShortAddress = dto.ShortAddress,
        IsOnline = dto.IsOnline,
        FirstSeenAt = dto.FirstSeenAt,
        LastSeenAt = dto.LastSeenAt,
        Identification = dto.Identification is null
            ? null
            : new DeviceIdentificationResponse
            {
                Id = dto.Identification.Id,
                Status = dto.Identification.Status,
                Gtin = dto.Identification.Gtin,
                Manufacturer = dto.Identification.Manufacturer,
                Model = dto.Identification.Model,
                FirmwareVersion = dto.Identification.FirmwareVersion,
                SerialNumber = dto.Identification.SerialNumber,
                DeviceType = dto.Identification.DeviceType,
                IdentifiedAt = dto.Identification.IdentifiedAt,
            },
        Match = dto.Match is null
            ? null
            : new DeviceMatchResponse
            {
                Id = dto.Match.Id,
                DeviceId = dto.Match.DeviceId,
                FixtureId = dto.Match.FixtureId,
                Status = dto.Match.Status,
                Confidence = dto.Match.Confidence,
                Discrepancies = dto.Match.Discrepancies,
                MatchedAt = dto.Match.MatchedAt,
            },
    };
}

public sealed class DeviceIdentificationResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Gtin { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? FirmwareVersion { get; set; }
    public string? SerialNumber { get; set; }
    public string? DeviceType { get; set; }
    public DateTime IdentifiedAt { get; set; }
}

public sealed class DeviceMatchResponse
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; }
    public string? FixtureId { get; set; }
    public string Status { get; set; } = string.Empty;
    public double? Confidence { get; set; }
    public List<string> Discrepancies { get; set; } = new();
    public DateTime MatchedAt { get; set; }
}