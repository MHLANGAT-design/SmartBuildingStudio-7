// Commands/StopDiscovery/StopDiscoveryValidator.cs

using FluentValidation;

namespace DeviceDiscoveryService.Application.Commands.StopDiscovery;

public sealed class StopDiscoveryValidator : AbstractValidator<StopDiscoveryCommand>
{
    public StopDiscoveryValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
    }
}