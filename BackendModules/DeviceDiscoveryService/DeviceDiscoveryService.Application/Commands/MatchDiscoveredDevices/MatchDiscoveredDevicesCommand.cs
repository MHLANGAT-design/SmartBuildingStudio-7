// Commands/MatchDiscoveredDevices/MatchDiscoveredDevicesCommand.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.MatchDiscoveredDevices;

public sealed record MatchDiscoveredDevicesCommand(Guid SessionId)
    : IRequest<DiscoverySessionDto>;