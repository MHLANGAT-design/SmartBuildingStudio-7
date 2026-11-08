// Commands/CancelDiscovery/CancelDiscoveryCommand.cs

using MediatR;

namespace DeviceDiscoveryService.Application.Commands.CancelDiscovery;

public sealed record CancelDiscoveryCommand(Guid SessionId) : IRequest<Unit>;