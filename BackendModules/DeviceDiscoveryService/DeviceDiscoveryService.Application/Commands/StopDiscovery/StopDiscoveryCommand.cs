// Commands/StopDiscovery/StopDiscoveryCommand.cs

using MediatR;

namespace DeviceDiscoveryService.Application.Commands.StopDiscovery;

public sealed record StopDiscoveryCommand(Guid SessionId) : IRequest<Unit>;