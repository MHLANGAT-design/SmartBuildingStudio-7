// Commands/StartDiscovery/StartDiscoveryCommand.cs

using DeviceDiscoveryService.Application.DTOs;
using MediatR;

namespace DeviceDiscoveryService.Application.Commands.StartDiscovery;

public sealed record StartDiscoveryCommand(Guid SessionId)
    : IRequest<DiscoverySessionDto>;