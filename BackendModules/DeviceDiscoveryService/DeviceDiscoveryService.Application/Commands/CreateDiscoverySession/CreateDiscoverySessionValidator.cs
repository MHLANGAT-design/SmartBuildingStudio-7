// Commands/CreateDiscoverySession/CreateDiscoverySessionValidator.cs

using FluentValidation;

namespace DeviceDiscoveryService.Application.Commands.CreateDiscoverySession;

public sealed class CreateDiscoverySessionValidator
    : AbstractValidator<CreateDiscoverySessionCommand>
{
    public CreateDiscoverySessionValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.FloorId).NotEmpty();
        RuleFor(x => x.GatewayId).NotEmpty();
        RuleFor(x => x.LineIds).NotEmpty()
            .WithMessage("At least one DALI line must be selected.");
        RuleForEach(x => x.LineIds).NotEmpty();
    }
}