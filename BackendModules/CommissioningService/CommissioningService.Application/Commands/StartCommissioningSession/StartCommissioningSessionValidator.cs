using FluentValidation;

namespace CommissioningService.Application.Commands.StartCommissioningSession;

public class StartCommissioningSessionValidator : AbstractValidator<StartCommissioningSessionCommand>
{
    public StartCommissioningSessionValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
    }
}