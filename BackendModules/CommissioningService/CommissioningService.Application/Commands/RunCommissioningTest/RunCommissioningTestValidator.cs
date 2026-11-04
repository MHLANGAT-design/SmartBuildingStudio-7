using FluentValidation;

namespace CommissioningService.Application.Commands.RunCommissioningTest;

public class RunCommissioningTestValidator : AbstractValidator<RunCommissioningTestCommand>
{
    public RunCommissioningTestValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.TestType).NotEmpty();
    }
}