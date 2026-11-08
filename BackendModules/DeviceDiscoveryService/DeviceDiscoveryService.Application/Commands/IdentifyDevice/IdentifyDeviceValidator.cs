// Commands/IdentifyDevice/IdentifyDeviceValidator.cs

using FluentValidation;

namespace DeviceDiscoveryService.Application.Commands.IdentifyDevice;

public sealed class IdentifyDeviceValidator : AbstractValidator<IdentifyDeviceCommand>
{
    public IdentifyDeviceValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.DeviceId).NotEmpty();
    }
}