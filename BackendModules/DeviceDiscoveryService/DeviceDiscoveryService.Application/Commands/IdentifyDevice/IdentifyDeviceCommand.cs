// Commands/IdentifyDevice/IdentifyDeviceCommand.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.IdentifyDevice;

public sealed record IdentifyDeviceCommand(
    Guid SessionId,
    Guid DeviceId,
    string? Gtin,
    string? Manufacturer,
    string? Model,
    string? FirmwareVersion,
    string? SerialNumber,
    string? DeviceType) : IRequest<DiscoveredDeviceDto>;