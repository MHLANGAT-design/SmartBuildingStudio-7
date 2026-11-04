using FluentValidation;

namespace CommissioningService.Application.Commands.CreateCommissioningSession;

public class CreateCommissioningSessionValidator : AbstractValidator<CreateCommissioningSessionCommand>
{
    public CreateCommissioningSessionValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty().WithMessage("ProjectId is required.");
        RuleFor(x => x.FloorplanId).NotEmpty().WithMessage("FloorplanId is required.");
        RuleFor(x => x.StartedBy).NotEmpty().WithMessage("StartedBy user is required.");
    }
}