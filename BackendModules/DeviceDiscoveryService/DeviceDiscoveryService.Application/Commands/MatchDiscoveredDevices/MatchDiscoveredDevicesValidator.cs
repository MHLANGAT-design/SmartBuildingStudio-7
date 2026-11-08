// Commands/MatchDiscoveredDevices/MatchDiscoveredDevicesValidator.cs

using FluentValidation;

namespace DeviceDiscoveryService.Application.Commands.MatchDiscoveredDevices;

public sealed class MatchDiscoveredDevicesValidator
    : AbstractValidator<MatchDiscoveredDevicesCommand>
{
    public MatchDiscoveredDevicesValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
    }
}