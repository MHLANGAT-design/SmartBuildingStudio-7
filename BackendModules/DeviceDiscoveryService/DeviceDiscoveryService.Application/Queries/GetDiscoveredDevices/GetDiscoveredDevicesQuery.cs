// Queries/GetDiscoveredDevices/GetDiscoveredDevicesQuery.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Queries.GetDiscoveredDevices;

public sealed record GetDiscoveredDevicesQuery(Guid SessionId)
    : IRequest<IReadOnlyList<DiscoveredDeviceDto>>;