// Commands/StartDiscovery/StartDiscoveryValidator.cs

using FluentValidation;

namespace DeviceDiscoveryService.Application.Commands.StartDiscovery;

public sealed class StartDiscoveryValidator
    : AbstractValidator<StartDiscoveryCommand>
{
    public StartDiscoveryValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
    }
}