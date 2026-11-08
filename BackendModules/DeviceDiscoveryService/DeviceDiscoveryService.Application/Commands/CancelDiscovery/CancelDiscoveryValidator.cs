// Commands/CancelDiscovery/CancelDiscoveryValidator.cs

using FluentValidation;

namespace DeviceDiscoveryService.Application.Commands.CancelDiscovery;

public sealed class CancelDiscoveryValidator : AbstractValidator<CancelDiscoveryCommand>
{
    public CancelDiscoveryValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
    }
}