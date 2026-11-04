using CommissioningService.Application.DTOs;
using CommissioningService.Domain.Entities;

namespace CommissioningService.Application.Mapping;

public static class CommissioningDeviceMapping
{
    public static DeviceStateDto ToDto(this CommissioningDevice device)
    {
        if (device == null) return null!;

        return new DeviceStateDto
        {
            Id = device.Id.Value,
            DeviceId = device.ExternalId,
            ShortAddress = device.Address?.Value,
            ConnectionStatus = device.CommunicationStatus,
            LastResponseAt = device.LastResponseAt,
            FirmwareVersion = device.FirmwareVersion,
            IsAddressed = device.IsAddressed
        };
    }
}